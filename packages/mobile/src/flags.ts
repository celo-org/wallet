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
  FIAT_SPEND_ENABLED: {
    PH: true,
  },
}

export const providerAvailability = {
  XANPOOL_RESTRICTED: {
    HK: true,
    SG: true,
    MY: true,
    PH: true,
    TH: true,
    IN: true,
    VN: true,
    ID: true,
    AU: true,
  },
  MOONPAY_RESTRICTED: {
    US: true,
    AF: true,
    AL: true,
    BS: true,
    BD: true,
    BB: true,
    BO: true,
    BW: true,
    KH: true,
    CN: true,
    CU: true,
    EC: true,
    GH: true,
    IS: true,
    IR: true,
    JM: true,
    MU: true,
    MN: true,
    MM: true,
    NI: true,
    KP: true,
    PK: true,
    PA: true,
    SS: true,
    SD: true,
    SY: true,
    UG: true,
    VE: true,
    YE: true,
    ZW: true,
    AS: true,
    GU: true,
    MP: true,
    VI: true,
  },
  SIMPLEX_RESTRICTED: {
    US: {
      AK: true,
      HI: true,
      LA: true,
      NV: true,
      NM: true,
      NY: true,
      VT: true,
      WA: true,
    },
    AF: true,
    AL: true,
    BS: true,
    BB: true,
    BW: true,
    KH: true,
    CU: true,
    GH: true,
    IR: true,
    IQ: true,
    JM: true,
    KP: true,
    KG: true,
    LB: true,
    LY: true,
    MU: true,
    MN: true,
    MM: true,
    NI: true,
    PK: true,
    PA: true,
    WS: true,
    SO: true,
    SS: true,
    SD: true,
    SY: true,
    TT: true,
    UG: true,
    VI: true,
    VU: true,
    VE: true,
    YE: true,
    ZW: true,
  },
  RAMP_RESTRICTED: {
    AF: true,
    DZ: true,
    AS: true,
    AI: true,
    AQ: true,
    AM: true,
    AW: true,
    AZ: true,
    BS: true,
    BD: true,
    BB: true,
    BY: true,
    BO: true,
    BQ: true,
    BV: true,
    IO: true,
    BN: true,
    KH: true,
    KY: true,
    CF: true,
    CN: true,
    CO: true,
    CD: true,
    CU: true,
    CW: true,
    CI: true,
    EC: true,
    ER: true,
    FJ: true,
    TF: true,
    HM: true,
    VA: true,
    ID: true,
    IR: true,
    IQ: true,
    JM: true,
    JP: true,
    JO: true,
    KP: true,
    KG: true,
    LS: true,
    LY: true,
    MO: true,
    MU: true,
    MN: true,
    MS: true,
    MA: true,
    MM: true,
    NA: true,
    NP: true,
    NI: true,
    OM: true,
    PK: true,
    PW: true,
    PS: true,
    PA: true,
    PN: true,
    QA: true,
    MK: true,
    RU: true,
    SH: true,
    KN: true,
    MF: true,
    VC: true,
    WS: true,
    ST: true,
    SA: true,
    SC: true,
    SX: true,
    SO: true,
    ZA: true,
    GS: true,
    SS: true,
    SD: true,
    SJ: true,
    SY: true,
    TW: true,
    TT: true,
    UG: true,
    UM: true,
    US: true,
    VU: true,
    VE: true,
    VN: true,
    VG: true,
    VI: true,
    EH: true,
    YE: true,
    ZM: true,
    ZW: true,
  },
  TRANSAK_RESTRICTED: {
    AF: true,
    AL: true,
    AS: true,
    AD: true,
    AO: true,
    AI: true,
    AQ: true,
    AG: true,
    AM: true,
    AW: true,
    AZ: true,
    BS: true,
    BH: true,
    BD: true,
    BB: true,
    BZ: true,
    BJ: true,
    BM: true,
    BT: true,
    BQ: true,
    BA: true,
    BW: true,
    BV: true,
    IO: true,
    BN: true,
    BF: true,
    BI: true,
    CV: true,
    KH: true,
    CM: true,
    KY: true,
    CF: true,
    TD: true,
    CN: true,
    CX: true,
    CC: true,
    KM: true,
    CD: true,
    CG: true,
    CK: true,
    HR: true,
    CU: true,
    CW: true,
    CI: true,
    DJ: true,
    DM: true,
    EC: true,
    EG: true,
    SV: true,
    GQ: true,
    ER: true,
    SZ: true,
    ET: true,
    FK: true,
    FO: true,
    FJ: true,
    GF: true,
    PF: true,
    TF: true,
    GA: true,
    GM: true,
    GE: true,
    GH: true,
    GI: true,
    GL: true,
    GD: true,
    GP: true,
    GU: true,
    GT: true,
    GG: true,
    GN: true,
    GW: true,
    GY: true,
    HT: true,
    HM: true,
    VA: true,
    HN: true,
    HU: true,
    IR: true,
    IQ: true,
    IM: true,
    JM: true,
    JE: true,
    JO: true,
    KZ: true,
    KE: true,
    KI: true,
    KP: true,
    KW: true,
    KG: true,
    LA: true,
    LB: true,
    LS: true,
    LR: true,
    LY: true,
    LI: true,
    LT: true,
    MO: true,
    MG: true,
    MW: true,
    MV: true,
    ML: true,
    MH: true,
    MQ: true,
    MR: true,
    MU: true,
    YT: true,
    FM: true,
    MD: true,
    MC: true,
    MN: true,
    ME: true,
    MS: true,
    MA: true,
    MZ: true,
    MM: true,
    NA: true,
    NR: true,
    NC: true,
    NI: true,
    NE: true,
    NG: true,
    NU: true,
    NF: true,
    MP: true,
    OM: true,
    PK: true,
    PW: true,
    PS: true,
    PA: true,
    PG: true,
    PN: true,
    PR: true,
    QA: true,
    MK: true,
    RU: true,
    RW: true,
    RE: true,
    BL: true,
    SH: true,
    KN: true,
    LC: true,
    MF: true,
    PM: true,
    VC: true,
    WS: true,
    SM: true,
    ST: true,
    SA: true,
    SN: true,
    RS: true,
    SC: true,
    SL: true,
    SX: true,
    SB: true,
    SO: true,
    GS: true,
    SS: true,
    LK: true,
    SD: true,
    SR: true,
    SJ: true,
    SY: true,
    TW: true,
    TJ: true,
    TL: true,
    TG: true,
    TK: true,
    TO: true,
    TT: true,
    TN: true,
    TM: true,
    TC: true,
    TV: true,
    UG: true,
    UA: true,
    AE: true,
    GB: true,
    UM: true,
    US: true,
    UY: true,
    UZ: true,
    VU: true,
    VE: true,
    VG: true,
    VI: true,
    WF: true,
    EH: true,
    YE: true,
    ZM: true,
    ZW: true,
    AX: true,
  },
}
