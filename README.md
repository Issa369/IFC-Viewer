# IFC.JS Viewer Application

This project integrates OpenBIM-Components into a React application to create a 3D visualization environment for IFC models.

## Overview

The project uses OpenBIM-Components for handling 3D scene rendering and IFC model interaction.

## Features

- **3D Model Visualization:** Display IFC models in a 3D scene using the my custom Open BIM Components library.
- **Model Hierarchy Tree:** Explore the hierarchical structure of the model through a tree view.
- **Entity Highlighting:** Click on tree items to highlight corresponding entities in the 3D scene.
- **Double-Click Zoom:** Double-click on a specific entity to zoom in on and focus the camera on that element.
- **File Import:** Import IFC files to load models into the application.

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

### basic Usage

- Launch the application, and you will be greeted with the IFC Viewer interface.
- Use the "Import File" button to load an IFC file and visualize the model.
- Explore the model hierarchy in the sidebar by expanding tree nodes.
- Click on tree items to highlight corresponding entities in the 3D scene.
- Double-click on a specific entity to zoom in and focus the camera on that element.

# Components

### ComponentsProvider

The ComponentsProvider component initializes the Open BIM Components library and provides a context for other components to access the OBC.Components instance.

### Main

The Main component serves as the main container for the IFC Viewer application. It manages the state of the model tree and initializes the 3D scene using the BaseComponents function.

### SideTree

The SideTree component displays a hierarchical tree view of the model entities. It allows users to navigate the model hierarchy and highlights the corresponding 3D mesh when a tree leaf is clicked.

# Libraries Used

The IFC Viewer application utilizes the following key libraries:

- **React:** A JavaScript library for building user interfaces.
- **Mui:** A simple, customizable, and accessible library of React components.
- **Open BIM Components:** The OpenBIM-Components library has been cloned and extended with custom features, allowing the application to seamlessly integrate and interact with (IFC) models within a web-based environment.

# Future Development

Opportunities for future development and improvement include:

- **Enhanced Element Information:** Present additional details about selected entities to provide users with a more comprehensive understanding.

- **Model Deletion:** Implement a delete button functionality to streamline the removal of loaded models, contributing to a more efficient and organized user experience.
