import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import nextI18NextConfig from '../next-i18next.config.js'

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: await serverSideTranslations(locale || 'en', [], nextI18NextConfig),
})

export default function Home() {
  const { t } = useTranslation()

  return (
    <ul>
      <li>{t('Hello world')}</li>
    </ul>
  )
}
