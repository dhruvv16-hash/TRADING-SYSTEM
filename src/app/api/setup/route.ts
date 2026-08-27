import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Force prisma to use the environment variable
    const output = execSync('npx prisma db push --accept-data-loss', { encoding: 'utf-8' });
    return NextResponse.json({ success: true, output });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message, 
      stdout: error.stdout?.toString(), 
      stderr: error.stderr?.toString() 
    }, { status: 500 });
  }
}
