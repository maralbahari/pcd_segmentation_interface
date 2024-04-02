# segment_pcd_interface

## Setup
Download [Node.js](https://nodejs.org/en/download/).
Run this followed commands:

``` bash
# Install dependencies (only the first time)
npm install

# Run the local server at localhost:8080
npm run dev

# Build for production in the dist/ directory
npm run build
```
## Load Point Cloud
- place your point cloud file (.pcd) under config/pcd.
- in `src/index.js` point to the point cloud file directory in `getPcd` method. 