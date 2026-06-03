#!/bin/bash

echo "Testing /api/test-score..."
curl -s http://localhost:3000/api/test-score
echo ""

echo "Testing /api/apply (high score)..."
curl -s -X POST http://localhost:3000/api/apply \
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
echo ""

echo "Testing /api/apply (low score)..."
curl -s -X POST http://localhost:3000/api/apply \
  -H "Content-Type: application/json" \
  -d '{
    "veteran": false,
    "womanOwned": false,
    "minorityOwned": false,
    "firstTimeFarmer": false,
    "creditScore": 650,
    "liquidity": 20000,
    "experienceLevel": 1,
    "collateralEquity": 25000,
    "acreage": 2
  }'
echo ""
