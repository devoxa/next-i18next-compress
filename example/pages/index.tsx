import { GetStaticProps } from 'next'
import { Trans, useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import React from 'react'
import nextI18NextConfig from '../next-i18next.config.js'

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: await serverSideTranslations(locale || 'en', [], nextI18NextConfig),
})

export default function Home() {
  const { t } = useTranslation()

  return (
    <ul>
      <li>{t('Hello world')}</li>
      <li>
        <Trans t={t}>Hello world</Trans>
      </li>
    </ul>
  )
}
