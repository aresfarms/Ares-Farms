#!/bin/bash
cat .next/trace 2>/dev/null | pbcopy
echo "Copied if trace exists"
