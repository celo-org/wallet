import hoistStatics from 'hoist-non-react-statics'
import { withTranslation as withTranslationI18Next } from 'react-i18next'

const t = (key: string, params?: any) => {
  if (typeof params !== 'object' || Object.keys(params).length === 0) {
    return key
  }
  return [key, JSON.stringify(params)].join(', ')
}

export default {
  language: 'EN',
  t,
  changeLanguage: jest.fn().mockResolvedValue(t),
}

export enum Namespaces {}

export const withTranslation = (namespace: any) => (component: React.ComponentType<any>) =>
  hoistStatics(withTranslationI18Next(namespace)(component), component)
