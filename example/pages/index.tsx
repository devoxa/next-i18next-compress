import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: await serverSideTranslations(locale || 'en'),
})

export default function Home() {
  const { t } = useTranslation()

  return (
    <ul>
      <li>{t('Hello world')}</li>
    </ul>
  )
}
