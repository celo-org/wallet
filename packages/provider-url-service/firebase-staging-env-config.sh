#!/usr/bin/env bash

firebase functions:config:set \
transak.public_key_staging=$(grep TRANSAK_PUBLIC_KEY_STAGING .env | cut -d '=' -f 2-) \
transak.private_key_staging=$(grep TRANSAK_PRIVATE_KEY_STAGING .env | cut -d '=' -f 2-) \
ramp.public_key_staging=$(grep RAMP_PUBLIC_KEY_STAGING .env | cut -d '=' -f 2-) \
moonpay.public_key_staging=$(grep MOONPAY_PUBLIC_KEY_STAGING .env | cut -d '=' -f 2-) \
moonpay.private_key_staging=$(grep MOONPAY_PRIVATE_KEY_STAGING .env | cut -d '=' -f 2-) \