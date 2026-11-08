# FlowMoa FFmpeg renderer

Deploy this container to a long-running container platform (for example Cloud Run). Set `RENDER_SERVICE_TOKEN` and `PUBLIC_RENDER_URL`. The Worker submits saved D1 timelines here; the service downloads R2-backed assets, performs crop/scale, image pan/zoom, cuts, text overlay and optional background audio, then exposes the resulting MP4 for the Worker to copy into R2.
