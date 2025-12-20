'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MigrationsPage() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [verification, setVerification] = useState<any>(null);
  const { toast } = useToast();

  const runMigration = async (migrationName: string) => {
    setRunning(true);
    setResults([]);
    setErrors([]);
    setVerification(null);

    try {
      const response = await fetch('/api/admin/run-migration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ migration: migrationName }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results || []);
        setVerification(data.verification);
        toast({
          title: 'Migration Successful',
          description: data.message,
        });
      } else {
        setResults(data.results || []);
        setErrors(data.errors || []);
        setVerification(data.verification);
        toast({
          title: 'Migration Completed with Errors',
          description: data.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      setErrors([error.message || 'Failed to run migration']);
      toast({
        title: 'Error',
        description: 'Failed to run migration',
        variant: 'destructive',
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-display mb-2">Database Migrations</h1>
          <p className="text-muted-foreground">
            Run database migrations to add missing columns
          </p>
        </div>

        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Available Migrations</h2>
            <p className="text-sm text-muted-foreground">
              Click a button to run the corresponding migration. Migrations are idempotent and safe to run multiple times.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => runMigration('all')}
              disabled={running}
              size="lg"
            >
              {running ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                'Run All Migrations'
              )}
            </Button>
            <Button
              onClick={() => runMigration('bio')}
              disabled={running}
              variant="outline"
            >
              Add Bio Column
            </Button>
            <Button
              onClick={() => runMigration('terms')}
              disabled={running}
              variant="outline"
            >
              Add Terms Column
            </Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Results:</h3>
              <div className="space-y-1">
                {results.map((result, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>{result}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-destructive">Errors:</h3>
              <div className="space-y-1">
                {errors.map((error, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                    <XCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {verification && (
            <div className="space-y-2">
              <h3 className="font-semibold">Column Verification:</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {verification.bio ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span>bio column: {verification.bio ? '✅ Exists' : '❌ Missing'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {verification.terms_accepted_at ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span>terms_accepted_at column: {verification.terms_accepted_at ? '✅ Exists' : '❌ Missing'}</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

