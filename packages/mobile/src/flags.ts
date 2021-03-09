// Feature flags
export const features = {
  SHOW_SHOW_REWARDS_APP_LINK: false,
  USE_COMMENT_ENCRYPTION: true,
  SHOW_ADD_FUNDS: true,
  DATA_SAVER: true,
  PHONE_NUM_METADATA_IN_TRANSFERS: true,
  VERIFICATION_FORNO_RETRY: true,
  CUSD_MOONPAY_ENABLED: false,
  SHOW_CASH_OUT: true,
  PNP_USE_DEK_FOR_AUTH: true,
  KOMENCI: true,
  ESCROW_WITHOUT_CODE: true,
}

export const pausedFeatures = {
  INVITE: true,
}

// Country specific features, unlisted countries are set to `false` by default
// Using 2 letters alpha code. See https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
export const countryFeatures = {
  RESTRICTED_CP_DOTO: {
    JP: true,
    PH: true,
  },
  SANCTIONED_COUNTRY: {
    IR: true,
    CU: true,
    KP: true,
    SD: true,
    SY: true,
  },
  MOONPAY_DISABLED: {
    US: true,
  },
  PONTO_SUPPORTED: {
    PH: true,
  },
  KOTANI_SUPPORTED: {
    KE: true,
  },
  FIAT_SPEND_ENABLED: {
    PH: true,
  },
}

export const providerAvailability = {
  MOONPAY_RESTRICTED: {
    US: {
      HI: true,
      NY: true,
      RI: true,
      AS: true,
      GU: true,
      MP: true,
      VI: true,
    },
  },
  SIMPLEX_RESTRICTED: {
    US: {
      HI: true,
      NY: true,
    },
  },
  RAMP_RESTRICTED: {
    US: {
      HI: true,
      NY: true,
      NE: true,
    },
  },
  TRANSAK_RESTRICTED: {
    US: {
      HI: true,
      NY: true,
      NH: true,
      VT: true,
      VA: true,
      NC: true,
      CT: true,
      TX: true,
    },
  },
}
