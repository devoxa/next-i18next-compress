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
  const name = 'Sam'

  return (
    <>
      <ul>
        <li>1: {t('Hello world')}</li>
        <li>2: {t(`Hello world`)}</li>
        <li>3: {t(`Happy birthday, {{name}}!`, { name })}</li>
        <li>4: {t(`Happy birthday, {{ name }}!`, { name })}</li>
      </ul>

      <ul>
        <li>
          1: <Trans t={t}>Hello world</Trans>
        </li>
        <li>
          2:{' '}
          <Trans t={t} i18nKey='Hello world'>
            Foobar
          </Trans>
        </li>
        <li>
          3: <Trans t={t} i18nKey='Hello world' />
        </li>
        <li>
          4: <Trans t={t} i18nKey='Hello world'></Trans>
        </li>
        <li>
          5: <Trans t={t} i18nKey={`Hello world`} />
        </li>
        <li>
          6:{' '}
          <Trans t={t}>
            <a>Hello world</a>
          </Trans>
        </li>
        <li>
          7:{' '}
          <Trans t={t}>
            Hello <a>world</a>
          </Trans>
        </li>
        <li>
          8:{' '}
          <Trans t={t}>
            <Foo /> Hello world
          </Trans>
        </li>
        <li>
          9:{' '}
          <Trans t={t} i18nKey='MySpecialKey'>
            Hello <a>world</a>
          </Trans>
        </li>
        <li>
          10:{' '}
          <Trans t={t}>
            Hello world
            {/* with a sneaky comment */}
          </Trans>
        </li>
        <li>
          11: <Trans t={t}>Hello{'  '}world</Trans>
        </li>
        <li>
          12:{' '}
          <Trans t={t}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer aliquam, tellus ut
            vulputate venenatis, ipsum mi efficitur est, vel ornare ex enim eget orci. Nam mattis
            libero quis finibus hendrerit.
          </Trans>
        </li>
        <li>
          13: <Trans t={t}>Happy birthday, {{name}}!</Trans>
        </li>
        <li>
          14: <Trans t={t}>Happy birthday, {{ name }}!</Trans>
        </li>
      </ul>
    </>
  )
}

function Foo() {
  return <strong>Foo</strong>
}
