# BPMN Entity Color Analysis for Dark/Light Mode

## Current Issues to Fix

### 1. Events (Start, End, Intermediate)
- **Circle Elements**: Currently using basic stroke/fill
- **Inner Icons**: Not properly styled for visibility
- **Sub-types**: Message, Timer, Error, Signal icons need contrast

### 2. Tasks (User, Service, Manual, Script)
- **Rectangle Elements**: Basic styling works
- **Task Icons**: User, Service, Script icons may not be visible
- **Text Labels**: Need proper contrast

### 3. Gateways (Exclusive, Parallel, Inclusive)
- **Diamond Shape**: Basic polygon styling
- **Inner Symbols**: X, +, O symbols need visibility check
- **Complex Gateway**: Star symbol visibility

### 4. Data Objects
- **Document Shape**: Path elements need styling
- **Data Store**: Database cylinder shape
- **Collection Marker**: Three parallel lines

### 5. Participants (Pools/Lanes)
- **Container Borders**: Need clear visibility
- **Header Background**: Should contrast with canvas
- **Text Labels**: Pool/Lane names

### 6. Connections
- **Sequence Flows**: Arrow lines and heads
- **Message Flows**: Dashed lines
- **Association**: Dotted lines
- **Data Association**: Dotted arrows

### 7. Boundary Events
- **Double Circle**: Inner and outer circles
- **Interrupting vs Non-interrupting**: Solid vs dashed
- **Attached to Activities**: Visibility on task borders

### 8. Sub-processes
- **Expanded**: Border and background
- **Collapsed**: Plus marker visibility
- **Event Sub-process**: Dotted border

### 9. Artifacts
- **Text Annotations**: Box and text
- **Groups**: Dashed rectangle border

## Required CSS Selectors

```css
/* Events - need inner icon styling */
.djs-element[data-element-id*="Event"] .djs-visual > circle
.djs-element[data-element-id*="Event"] .djs-visual > path /* inner icons */

/* Tasks - need icon styling */
.djs-element[data-element-id*="Task"] .djs-visual > rect
.djs-element[data-element-id*="Task"] .djs-visual > path /* task icons */

/* Gateways - need symbol styling */
.djs-element[data-element-id*="Gateway"] .djs-visual > polygon
.djs-element[data-element-id*="Gateway"] .djs-visual > path /* gateway symbols */

/* Data Objects */
.djs-element[data-element-id*="DataObject"] .djs-visual > path
.djs-element[data-element-id*="DataStore"] .djs-visual > path

/* Participants */
.djs-element[data-element-id*="Participant"] .djs-visual > rect
.djs-element[data-element-id*="Lane"] .djs-visual > rect

/* Connections */
.djs-connection .djs-visual > path
.djs-connection > .djs-visual > polyline /* arrow heads */

/* Markers and Decorations */
.djs-element .djs-visual > .djs-element-marker
.djs-element .djs-visual > g /* grouped elements */
```

## Color Scheme Requirements

### Light Mode
- **Background**: #f9fafb
- **Primary Stroke**: #000000
- **Fill**: #ffffff
- **Icons/Symbols**: #000000
- **Text**: #000000
- **Selection**: #2563eb
- **Hover**: #e5e7eb

### Dark Mode
- **Background**: #111827
- **Primary Stroke**: #ffffff
- **Fill**: #1f2937
- **Icons/Symbols**: #ffffff
- **Text**: #ffffff
- **Selection**: #60a5fa
- **Hover**: #374151

## Testing Checklist
- [ ] Start Events (all sub-types)
- [ ] End Events (all sub-types)
- [ ] Intermediate Events (throw/catch)
- [ ] Boundary Events
- [ ] User Task
- [ ] Service Task
- [ ] Script Task
- [ ] Manual Task
- [ ] Business Rule Task
- [ ] Send/Receive Task
- [ ] Exclusive Gateway
- [ ] Parallel Gateway
- [ ] Inclusive Gateway
- [ ] Event-based Gateway
- [ ] Complex Gateway
- [ ] Data Object
- [ ] Data Store
- [ ] Pool/Lane
- [ ] Sub-process (expanded/collapsed)
- [ ] Text Annotation
- [ ] Group
- [ ] All connection types