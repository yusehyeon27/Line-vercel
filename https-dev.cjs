#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const { spawnSync } = require('child_process');

// Read certificate files
const key = fs.readFileSync('./key.pem');
const cert = fs.readFileSync('./cert.pem');

// Run next dev with HTTPS options
const result = spawnSync('next', ['dev', '--experimental-https', '--experimental-https-key', './key.pem', '--experimental-https-cert', './cert.pem'], {
  stdio: 'inherit',
  shell: true
});

process.exit(result.status);
