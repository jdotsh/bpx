import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">BPMN Studio Web</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Enterprise-grade BPMN process design and modeling platform
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/signin">
            <Button size="lg">Sign In</Button>
          </Link>
          <Link href="/studio">
            <Button size="lg" variant="outline">Open Studio (Demo)</Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Visual Process Design</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Create and edit BPMN diagrams with our intuitive drag-and-drop interface
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Multi-Format Support</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Export your processes as BPMN XML, YAML, or JSON formats
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enterprise Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Built with TypeScript, Next.js, and modern web technologies
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}