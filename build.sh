#!/bin/bash

mkdir -p pkg/
sudo podman build . --tag ai/autoprefixer-rails
sudo podman run --privileged --rm -v ./pkg/:/var/app/pkg/ ai/autoprefixer-rails:latest