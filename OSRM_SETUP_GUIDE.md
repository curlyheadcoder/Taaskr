# Taaskr — Self-Hosted OSRM Infrastructure Setup Guide

This guide describes how to run a self-hosted OSRM (Open Source Routing Machine) routing engine for Taaskr using OpenStreetMap data for Madhya Pradesh / Indore.

---

## 1. Prerequisites

- Docker & Docker Compose installed on your server or dev machine.
- ~1 GB free disk space for the extracted dataset.

---

## 2. Step-by-Step Dataset Preparation (Manual Setup)

Run the following commands in your terminal to download and preprocess the OSM data:

```bash
# 1. Create a data directory
mkdir -p osrm-data
cd osrm-data

# 2. Download the Madhya Pradesh OSM extract from Geofabrik (~50 MB)
curl -O https://download.geofabrik.de/asia/india/madhya-pradesh-latest.osm.pbf

# 3. Extract OSM data using OSRM car profile
docker run -t -v $(pwd):/data osrm/osrm-backend osrm-extract -p /opt/car.lua /data/madhya-pradesh-latest.osm.pbf

# 4. Partition the data (Multi-Level Dijkstra)
docker run -t -v $(pwd):/data osrm/osrm-backend osrm-partition /data/madhya-pradesh-latest.osrm

# 5. Customize cell metrics
docker run -t -v $(pwd):/data osrm/osrm-backend osrm-customize /data/madhya-pradesh-latest.osrm
```

---

## 3. Launching the OSRM Routing Engine

Once the preprocessing steps complete, launch the OSRM container via Docker Compose:

```bash
docker-compose -f docker-compose.osrm.yml up -d
```

The OSRM service will be available at:
`http://localhost:5000`

---

## 4. Environment Variables & Backend Configuration

In `taaskr-backend`, set the following environment variable to point to your self-hosted OSRM instance:

```properties
TAASKR_ROUTING_OSRM_BASE_URL=http://localhost:5000
TAASKR_ROUTING_OSRM_TIMEOUT_MS=2000
TAASKR_ROUTING_MIN_MOVEMENT_METERS=100.0
TAASKR_ROUTING_MIN_INTERVAL_SECONDS=30
```

To test the endpoint manually:
```bash
curl "http://localhost:5000/route/v1/driving/75.8577,22.7196;75.8800,22.7500?overview=false"
```
