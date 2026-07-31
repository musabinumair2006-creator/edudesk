import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { suggestion_id, action, teacher_note, updated_content } = body

    if (!suggestion_id || !action) {
      return NextResponse.json({ error: 'Missing suggestion_id or action.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const teacherId = session?.user?.id || 'teacher-1'

    // Fetch suggestion
    const { data: suggestion } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('id', suggestion_id)
      .single()

    const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'modified'
    const finalContent = updated_content || suggestion?.content

    // Update suggestion row
    await supabase
      .from('ai_suggestions')
      .update({
        status: newStatus,
        teacher_note: teacher_note || null,
        content: finalContent,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', suggestion_id)

    // If approved generated_assignment -> create assignment record
    if (newStatus === 'approved' && suggestion?.suggestion_type === 'generated_assignment') {
      const c = finalContent || {}
      await supabase.from('assignments').insert({
        teacher_id: teacherId,
        class_id: suggestion.related_id || 'cls-1',
        title: c.title || 'Physics Assignment',
        content: JSON.stringify(c.sections || c.content || c),
        topic: c.topic || 'Physics',
        total_marks: c.total_marks || 50,
        assignment_type: 'assignment',
        status: 'approved',
        ai_generated: true,
        answer_key: JSON.stringify(c.answer_key || []),
      })
    }

    // If approved student_report -> create report record
    if (newStatus === 'approved' && (suggestion?.suggestion_type === 'student_report' || suggestion?.suggestion_type === 'class_report')) {
      await supabase.from('reports').insert({
        teacher_id: teacherId,
        report_type: suggestion.suggestion_type === 'student_report' ? 'student' : 'class',
        student_id: suggestion.related_id || null,
        content: finalContent,
      })
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error updating suggestion status.' }, { status: 500 })
  }
}
