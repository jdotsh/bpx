# GenAI BPMN Studio

A modern, enterprise-grade BPMN process design and modeling platform built with Next.js 14.

## Features

- **BPMN 2.0 Compliant**: Full support for BPMN 2.0 specification
- **Drag & Drop Interface**: Intuitive drag-and-drop process modeling
- **Light/Dark Theme**: Built-in theme switching with full dark mode support
- **Import/Export**: Support for BPMN XML, YAML, and JSON formats
- **Undo/Redo**: Full command history support
- **Zoom Controls**: Zoom in/out and fit-to-viewport functionality
- **Minimap**: Bird's eye view navigation
- **Grid Background**: Alignment grid for precise element placement
- **Keyboard Shortcuts**: Productivity shortcuts for common actions

## Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components
- **BPMN.js**: BPMN rendering and editing engine
- **Lucide Icons**: Beautiful open-source icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jdotsh/genai-bpmn.git
cd genai-bpmn
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000/studio](http://localhost:3000/studio) in your browser

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## Usage

### Creating BPMN Diagrams

1. **Add Elements**: Drag elements from the left palette onto the canvas
2. **Connect Elements**: Use the connection tool to link process elements
3. **Move Elements**: Click and drag elements to reposition them
4. **Edit Properties**: Click on elements to edit their properties

### Toolbar Functions

- **Import**: Load existing BPMN files (XML, YAML, JSON)
- **Export**: Save diagrams as BPMN XML
- **Undo/Redo**: Navigate through edit history
- **Zoom**: Adjust canvas zoom level
- **Theme**: Toggle between light and dark modes

## Project Structure

```
├── app/                  # Next.js app router pages
├── components/          
│   ├── bpmn/            # BPMN-specific components
│   └── ui/              # Reusable UI components
├── lib/                 # Core business logic
│   ├── bpmn-designer.ts # BPMN.js integration
│   ├── bpmn-utils.ts    # BPMN utilities
│   └── types.ts         # TypeScript definitions
├── public/              # Static assets
└── types/               # TypeScript type declarations
```

## License

Proprietary - All rights reserved

## Author

Julian Sherollari

## Support

For issues, questions, or contributions, please visit [GitHub Issues](https://github.com/jdotsh/genai-bpmn/issues)
# bpx
