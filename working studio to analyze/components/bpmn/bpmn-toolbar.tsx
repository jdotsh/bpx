'use client'

import { memo, useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Download, 
  Upload,
  Save,
  FolderOpen,
  Eye,
  Play,
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut,
  MousePointer2,
  Eraser,
  Map,
  Languages,
  Moon,
  Sun,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  Presentation
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BpmnToolbarProps {
  onImport?: () => void
  onExport?: () => void
  onSave?: () => void
  onOpenFolder?: () => void
  onPreview?: () => void
  onRun?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onFitToViewport?: () => void
  onClear?: () => void
  onAlignLeft?: () => void
  onAlignCenter?: () => void
  onAlignRight?: () => void
  onAlignTop?: () => void
  onAlignMiddle?: () => void
  onAlignBottom?: () => void
  onToggleMinimap?: () => void
  onToggleLanguage?: () => void
  onToggleTheme?: () => void
  onMeetingMode?: () => void
  theme?: 'light' | 'dark'
  zoomLevel?: number
  canUndo?: boolean
  canRedo?: boolean
  disabled?: boolean
  isMeetingMode?: boolean
  isMinimapOpen?: boolean
}

export const BpmnToolbar = memo(function BpmnToolbar({
  onImport,
  onExport,
  onSave,
  onOpenFolder,
  onPreview,
  onRun,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFitToViewport,
  onClear,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onAlignTop,
  onAlignMiddle,
  onAlignBottom,
  onToggleMinimap,
  onToggleLanguage,
  onToggleTheme,
  onMeetingMode,
  theme = 'light',
  zoomLevel = 100,
  canUndo = false,
  canRedo = false,
  disabled = false,
  isMeetingMode = false,
  isMinimapOpen = false
}: BpmnToolbarProps) {
  const [isFitActive, setIsFitActive] = useState(false)

  // Toolbar button component for consistency
  const ToolbarButton = ({ 
    onClick, 
    icon: Icon, 
    title, 
    isDisabled = false,
    isActive = false,
    className 
  }: { 
    onClick?: () => void, 
    icon: React.ElementType, 
    title?: string,
    isDisabled?: boolean,
    isActive?: boolean,
    className?: string 
  }) => (
    <button
      onClick={onClick}
      disabled={isDisabled || disabled}
      title={title}
      className={cn(
        "p-1.5 rounded hover:bg-accent transition-colors inline-flex items-center justify-center",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        isActive && "bg-accent",
        className
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  )

  return (
    <div className="bpmn-toolbar flex items-center gap-2 px-3 py-1.5 border-b bg-card">
      {/* File Operations Group */}
      <div className="flex items-center gap-0.5 border border-border/50 rounded p-0.5">
        <ToolbarButton icon={Save} onClick={onSave} title="Save" />
        <ToolbarButton 
          icon={FolderOpen} 
          onClick={() => {
            // Trigger the hidden file input
            const fileInput = document.getElementById('file-import') as HTMLInputElement
            fileInput?.click()
          }} 
          title="Open" 
        />
        <input 
          type="file" 
          accept=".xml,.bpmn,.yaml,.yml,.json" 
          style={{ display: 'none' }} 
          id="file-import"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file && onImport) {
              // The actual file reading is handled in BpmnStudio
              onImport()
            }
            // Reset input so same file can be selected again
            e.target.value = ''
          }}
        />
        <ToolbarButton icon={Download} onClick={onExport} title="Export" />
        <ToolbarButton icon={Eye} onClick={onPreview} title="Preview" />
        <ToolbarButton icon={Play} onClick={onRun} title="Run Process" />
      </div>

      {/* Alignment Tools Group */}
      <div className="flex items-center gap-0.5 border border-border/50 rounded p-0.5">
        <ToolbarButton icon={AlignStartVertical} onClick={onAlignLeft} title="Align Left" />
        <ToolbarButton icon={AlignCenterVertical} onClick={onAlignCenter} title="Align Center" />
        <ToolbarButton icon={AlignEndVertical} onClick={onAlignRight} title="Align Right" />
        <ToolbarButton icon={AlignStartHorizontal} onClick={onAlignTop} title="Align Top" />
        <ToolbarButton icon={AlignCenterHorizontal} onClick={onAlignMiddle} title="Align Middle" />
        <ToolbarButton icon={AlignEndHorizontal} onClick={onAlignBottom} title="Align Bottom" />
      </div>

      {/* Zoom Controls Group */}
      <div className="flex items-center gap-0.5 border border-border/50 rounded p-0.5">
        <ToolbarButton icon={ZoomOut} onClick={onZoomOut} title="Zoom Out" />
        <button
          className="px-2 py-1.5 min-w-[50px] text-xs font-medium hover:bg-accent rounded transition-colors"
          onClick={onFitToViewport}
          title="Click to fit viewport"
        >
          {zoomLevel}%
        </button>
        <ToolbarButton icon={ZoomIn} onClick={onZoomIn} title="Zoom In" />
        <ToolbarButton 
          icon={MousePointer2} 
          onClick={() => {
            setIsFitActive(!isFitActive)
            onFitToViewport?.()
          }} 
          title="Fit to Viewport"
          isActive={isFitActive}
        />
        <ToolbarButton 
          icon={Map} 
          onClick={onToggleMinimap} 
          title="Toggle Minimap"
          isActive={isMinimapOpen}
        />
      </div>

      {/* History & Edit Group */}
      <div className="flex items-center gap-0.5 border border-border/50 rounded p-0.5">
        <ToolbarButton 
          icon={Undo2} 
          onClick={onUndo} 
          title="Undo" 
          isDisabled={!canUndo}
        />
        <ToolbarButton 
          icon={Redo2} 
          onClick={onRedo} 
          title="Redo" 
          isDisabled={!canRedo}
        />
        <ToolbarButton icon={Eraser} onClick={onClear} title="Clear All" />
      </div>

      {/* Settings Group */}
      <div className="flex items-center gap-0.5 border border-border/50 rounded p-0.5">
        <ToolbarButton icon={Languages} onClick={onToggleLanguage} title="Language" />
        <ToolbarButton 
          icon={Presentation} 
          onClick={onMeetingMode} 
          title="Meeting/Presentation Mode"
          isActive={isMeetingMode}
        />
        <ToolbarButton 
          icon={theme === 'light' ? Sun : Moon} 
          onClick={onToggleTheme} 
          title="Toggle Theme" 
        />
      </div>
    </div>
  )
})