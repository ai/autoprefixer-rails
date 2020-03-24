#!/bin/bash

podman build . --tag ai/autoprefixer-rails
podman run --privileged --rm -v ./pkg/:/var/app/pkg/ ai/autoprefixer-rails:latest