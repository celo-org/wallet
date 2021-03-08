#!/usr/bin/env bash

firebase functions:config:set \
transak.public_key_prod=$(grep TRANSAK_PUBLIC_KEY_PROD .env | cut -d '=' -f 2-) \
transak.private_key_prod=$(grep TRANSAK_PRIVATE_KEY_PROD .env | cut -d '=' -f 2-) \
ramp.public_key_prod=$(grep RAMP_PUBLIC_KEY_PROD .env | cut -d '=' -f 2-) \
moonpay.public_key_prod=$(grep MOONPAY_PUBLIC_KEY_PROD .env | cut -d '=' -f 2-) \
moonpay.private_key_prod=$(grep MOONPAY_PRIVATE_KEY_PROD .env | cut -d '=' -f 2-) \