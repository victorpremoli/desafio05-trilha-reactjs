import { GetStaticPaths, GetStaticProps } from 'next';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';

import format from 'date-fns/format';
import { ptBR } from 'date-fns/locale';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const { isFallback } = useRouter();

  if (isFallback || !post) {
    return <p>Carregando...</p>;
  }

  const readingTime = Math.ceil(
    RichText.asText(
      post.data.content.reduce((acc, data) => [...acc, ...data.body], [])
    ).split(' ').length / 200
  );

  return (
    <>
      <Header />
      <main className={styles.container}>
        <div className={styles.imgContainer}>
          <img src={post.data.banner.url} alt="Banner" />
        </div>

        <article className={styles.content}>
          <h1>{post.data.title}</h1>

          <header>
            <time>
              <FiCalendar /> {format(new Date(post.first_publication_date), "dd MMM yyyy", { locale: ptBR, })}
            </time>
            <p>
              <FiUser /> {post.data.author}
            </p>
            <p>
              <FiClock /> {readingTime} min
            </p>
          </header>

          {post.data.content.map(({ heading, body }, key) => (
            <div key={`${post.uid}.${key}`}>
              {heading && <h2 className={styles.heading}>{heading}</h2>}
              <div
                className={styles.body}
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(body)
                }}
              />
            </div>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    { pageSize: 1 }
  );

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      }
    }
  })

  return {
    paths,
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url
      },
      subtitle: response.data.subtitle,
      author: response.data.author,
      content: response.data.content,
    }
  }

  console.log(post);

  return {
    props: { post }
  }
};
