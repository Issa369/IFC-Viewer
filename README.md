# IFC.JS Viewer

This project integrates OpenBIM-Components into a React application to create a 3D visualization environment for IFC models.

## Overview

The project uses OpenBIM-Components for handling 3D scene rendering and IFC model interaction.

## Features

- **BaseComponents**: Initializes fundamental components for a 3D scene, including a scene, renderer, camera, raycaster, and a simple grid.

- **IFChandler**: Manages the loading and interaction with IFC models. It includes features such as fragment classification, highlighting, and properties rendering.

- **ToolBar**: Creates and configures a toolbar with UI elements for IFC loading, fragment management, properties processing and model tree navigation

# Getting Started

## Prerequisites

- Node.js and npm installed

## Installation

1. Clone the repository:

   - git clone https://github.com/Issa369/IFC-Viewer.git

2. Install dependencies:

   - cd ./IFC-Viewer

   - npm install

# Usage

### Start the development server:

- npm run dev

# Project Structure

- **src/Components**: Contains React components for setting up the 3D scene and handling IFC models.
- **public**: Contains IFC sample models and WASM files that are necessary for loading the ifcLoader
- **App.js**: Main React component that initializes OpenBIM-Components and sets up the 3D scene.

# Libraries Used

- React: A JavaScript library for building user interfaces.
- OpenBIM-Components: A library for 3D visualization of Industry Foundation Classes (IFC) models.
