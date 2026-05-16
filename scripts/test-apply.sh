#!/bin/bash

curl -i http://localhost:3000/api/apply \
  -H "Content-Type: application/json" \
  -d '{
    "veteran": true,
    "womanOwned": true,
    "minorityOwned": false,
    "firstTimeFarmer": true,
    "creditScore": 720,
    "liquidity": 85000,
    "experienceLevel": 3,
    "collateralEquity": 150000,
    "acreage": 25
  }'
