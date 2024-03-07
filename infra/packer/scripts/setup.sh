#!/bin/bash

sudo dnf module enable -y nodejs:18

sudo dnf install -y nodejs

sudo dnf install -y unzip

sudo mkdir -p /home/rishindesai/speaker

sudo unzip -o /tmp/speaker.zip -d /home/rishindesai/speaker

