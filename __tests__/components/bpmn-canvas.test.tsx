import React from 'react'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BpmnCanvas } from '@/components/bpmn/bpmn-canvas-fixed'
import { BpmnDesigner } from '@/lib/bpmn-designer'

// Mock the BpmnDesigner class
jest.mock('@/lib/bpmn-designer')
jest.mock('@/lib/fix-hit-areas', () => ({
  startHitAreaFixer: jest.fn(() => jest.fn())
}))

describe('BpmnCanvas Component', () => {
  let mockDesigner: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mock designer instance
    mockDesigner = {
      destroy: jest.fn(),
      changeTheme: jest.fn(),
      getEventBus: jest.fn(() => ({
        on: jest.fn(),
        off: jest.fn(),
      })),
      getCommandStack: jest.fn(() => ({
        on: jest.fn(),
        off: jest.fn(),
      })),
    }

    ;(BpmnDesigner as jest.Mock).mockImplementation(() => mockDesigner)
  })

  afterEach(() => {
    cleanup()
  })

  it('renders without crashing', () => {
    const { container } = render(<BpmnCanvas />)
    expect(container.querySelector('.bpmn-canvas')).toBeInTheDocument()
  })

  it('initializes BpmnDesigner after mount', async () => {
    render(<BpmnCanvas />)
    
    await waitFor(() => {
      expect(BpmnDesigner).toHaveBeenCalledTimes(1)
    }, { timeout: 500 })
  })

  it('calls onDesignerReady callback when designer is initialized', async () => {
    const onDesignerReady = jest.fn()
    render(<BpmnCanvas onDesignerReady={onDesignerReady} />)
    
    await waitFor(() => {
      expect(onDesignerReady).toHaveBeenCalledWith(mockDesigner)
    }, { timeout: 500 })
  })

  it('properly cleans up on unmount', async () => {
    const { unmount } = render(<BpmnCanvas />)
    
    await waitFor(() => {
      expect(BpmnDesigner).toHaveBeenCalled()
    })

    unmount()

    expect(mockDesigner.destroy).toHaveBeenCalled()
    expect(mockDesigner.getEventBus().off).toHaveBeenCalled()
  })

  it('changes theme when theme prop changes', async () => {
    const { rerender } = render(<BpmnCanvas options={{ theme: 'light' }} />)
    
    await waitFor(() => {
      expect(BpmnDesigner).toHaveBeenCalled()
    })

    rerender(<BpmnCanvas options={{ theme: 'dark' }} />)

    await waitFor(() => {
      expect(mockDesigner.changeTheme).toHaveBeenCalledWith('dark')
    })
  })

  it('prevents re-initialization when props do not change', async () => {
    const options = { theme: 'light' as const }
    const onDesignerReady = jest.fn()
    
    const { rerender } = render(
      <BpmnCanvas options={options} onDesignerReady={onDesignerReady} />
    )
    
    await waitFor(() => {
      expect(BpmnDesigner).toHaveBeenCalledTimes(1)
    })

    // Re-render with same props
    rerender(
      <BpmnCanvas options={options} onDesignerReady={onDesignerReady} />
    )

    // Should not create new instance
    expect(BpmnDesigner).toHaveBeenCalledTimes(1)
  })

  it('applies custom className', () => {
    const { container } = render(<BpmnCanvas className="custom-class" />)
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })

  it('handles initialization errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    
    ;(BpmnDesigner as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Initialization failed')
    })

    render(<BpmnCanvas />)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize BPMN designer:',
        expect.any(Error)
      )
    })

    consoleErrorSpy.mockRestore()
  })

  it('prevents memory leaks with proper cleanup registry', async () => {
    const { unmount } = render(<BpmnCanvas />)
    
    await waitFor(() => {
      expect(BpmnDesigner).toHaveBeenCalled()
    })

    // Track event listeners
    const eventBus = mockDesigner.getEventBus()
    const commandStack = mockDesigner.getCommandStack()
    
    expect(eventBus.on).toHaveBeenCalled()
    expect(commandStack.on).toHaveBeenCalled()

    unmount()

    // Verify all listeners are removed
    expect(eventBus.off).toHaveBeenCalled()
    expect(commandStack.off).toHaveBeenCalled()
    expect(mockDesigner.destroy).toHaveBeenCalled()
  })
})