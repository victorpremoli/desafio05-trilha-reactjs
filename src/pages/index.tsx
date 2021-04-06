import { GetStaticProps } from 'next';
import Link from 'next/link'
import Prismic from '@prismicio/client';

import { getPrismicClient } from '../services/prismic';
import { FiCalendar, FiUser } from "react-icons/fi";

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useState } from 'react';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  function handleLoadMorePosts() {
    fetch(postsPagination.next_page)
      .then(res => res.json())
      .then((res: ApiSearchResponse) => {
        const newPosts = res.results.map(newPost => {
          return {
            uid: newPost.uid,
            first_publication_date:newPost.first_publication_date,
            data: {
              author: newPost.data.author,
              title: newPost.data.title,
              subtitle: newPost.data.subtitle,
            }
          }
        })
        setPosts(oldPosts => [...oldPosts, ...newPosts]);
        setNextPage(res.next_page);
      })
  }

  return (
    <main className={styles.container}>
      <div className={styles.posts}>
        <Link href="/">
          <a >
            <img src="/Logo.svg" alt="logo" />
          </a>
        </Link>
        {posts.map(post => (
          <Link key={post.uid} href={`/post/${post.uid}`} >
            <a>
              <h1> {post.data.title} </h1>
              <p>{post.data.subtitle}</p>
              <div className={styles.footer}>
                <p> <FiCalendar /> {format(new Date(post.first_publication_date), "dd MMM yyyy", { locale: ptBR, })}</p>
                <p> <FiUser /> {post.data.author}</p>
              </div>
            </a>
          </Link>
        ))}
        {nextPage && (
          <a
            className={styles.morePosts}
            onClick={handleLoadMorePosts}
          >
            Carregar mais posts</a>
        )}
      </div>
    </main>
  );

}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.Predicates.at('document.type', 'post')
  ], {
    pageSize: 1,
  });

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    }
  })

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
    revalidate: 30 * 60 // 30 minutos
  };
};
