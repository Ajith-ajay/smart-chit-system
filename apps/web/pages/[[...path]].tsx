import dynamic from 'next/dynamic';
import Head from 'next/head';

const ExistingApplication = dynamic(() => import('../src/App'), { ssr: false });

export default function RoutePage() {
  return (
    <>
      <Head>
        <title>Smart Chit Management System (SCMS) Admin</title>
        <meta
          name="description"
          content="Production-grade admin dashboard for Smart Chit Management System."
        />
        <meta property="og:title" content="Smart Chit Management System (SCMS) Admin" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <ExistingApplication />
    </>
  );
}
