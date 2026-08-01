import React from 'react'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import type { Paper } from '@/lib/types'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
    color: '#0F172A',
  },
  coverPage: {
    padding: 40,
    fontFamily: 'Helvetica',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  academyHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subHeader: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 20,
  },
  titleBox: {
    width: '100%',
    border: '2pt solid #0F172A',
    padding: 16,
    marginVertical: 20,
    alignItems: 'center',
  },
  paperTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  levelBadge: {
    fontSize: 11,
    marginTop: 6,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  metaTable: {
    width: '100%',
    border: '1pt solid #E2E8F0',
    marginTop: 15,
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #E2E8F0',
    padding: 8,
  },
  metaLabel: {
    width: '35%',
    fontWeight: 'bold',
    color: '#475569',
  },
  metaValue: {
    width: '65%',
  },
  instructionsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    border: '1pt solid #E2E8F0',
    padding: 12,
    marginTop: 10,
  },
  instructionsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  instructionsText: {
    fontSize: 9,
    color: '#334155',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    backgroundColor: '#F1F5F9',
    padding: 6,
    marginVertical: 12,
    borderLeft: '3pt solid #2563EB',
  },
  questionContainer: {
    marginBottom: 14,
    paddingBottom: 8,
    borderBottom: '0.5pt solid #E2E8F0',
  },
  questionHeader: {
    flexDirection: 'row',
    justify: 'space-between',
    marginBottom: 4,
  },
  questionNum: {
    fontWeight: 'bold',
    fontSize: 11,
  },
  marksBadge: {
    fontWeight: 'bold',
    fontSize: 10,
  },
  questionText: {
    fontSize: 10,
    color: '#0F172A',
    marginBottom: 4,
  },
  answerBox: {
    marginTop: 6,
    padding: 6,
    backgroundColor: '#F0FDF4',
    borderLeft: '2pt solid #16A34A',
  },
  answerTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#16A34A',
    marginBottom: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#94A3B8',
    flexDirection: 'row',
    justify: 'space-between',
    borderTop: '0.5pt solid #E2E8F0',
    paddingTop: 4,
  },
})

/**
 * React PDF Document for Official Exam Paper
 */
const ExamPaperPDFDocument: React.FC<{ paper: Paper }> = ({ paper }) => {
  const sections = paper.content?.sections || []
  let globalQNum = 1

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <Text style={styles.academyHeader}>CENTAURUS ACADEMY</Text>
          <Text style={styles.subHeader}>Department of Physics</Text>

          <View style={styles.titleBox}>
            <Text style={styles.paperTitle}>{paper.title}</Text>
            <Text style={styles.levelBadge}>
              {paper.curriculum_level?.name || 'IGCSE / A-Level Physics'}
            </Text>
          </View>

          <View style={styles.metaTable}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Paper Type:</Text>
              <Text style={styles.metaValue}>{paper.paper_type.toUpperCase()}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Total Marks:</Text>
              <Text style={styles.metaValue}>{paper.total_marks} Marks</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Time Allowed:</Text>
              <Text style={styles.metaValue}>{paper.time_allowed || '1 Hour 30 Minutes'}</Text>
            </View>
          </View>

          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsTitle}>INSTRUCTIONS TO CANDIDATES</Text>
            <Text style={styles.instructionsText}>
              {paper.instructions ||
                'Answer all questions. Write your answers clearly. Show all working for calculation questions. Take g = 9.81 m/s² where appropriate.'}
            </Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Text>{paper.title} — Centaurus Academy</Text>
          <Text>Cover Page</Text>
        </View>
      </Page>

      {/* Questions Page */}
      <Page size="A4" style={styles.page}>
        {sections.map((sec, secIdx) => (
          <View key={secIdx}>
            <Text style={styles.sectionHeader}>{sec.label || `SECTION ${secIdx + 1}`}</Text>

            {sec.questions.map((q, qIdx) => {
              const currentNum = globalQNum++
              return (
                <View key={qIdx} style={styles.questionContainer} wrap={false}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNum}>Question {currentNum}</Text>
                    <Text style={styles.marksBadge}>[{q.marks} Marks]</Text>
                  </View>
                  <Text style={styles.questionText}>{q.question_text}</Text>
                </View>
              )
            })}
          </View>
        ))}

        <View style={styles.footer}>
          <Text>{paper.title} — Centaurus Academy</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            fixed
          />
        </View>
      </Page>
    </Document>
  )
}

/**
 * React PDF Document for Official Mark Scheme
 */
const MarkSchemePDFDocument: React.FC<{ paper: Paper }> = ({ paper }) => {
  const sections = paper.content?.sections || []
  let globalQNum = 1

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={{ marginBottom: 20, textAlign: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>OFFICIAL MARK SCHEME</Text>
          <Text style={{ fontSize: 12, color: '#2563EB', marginTop: 4 }}>{paper.title}</Text>
          <Text style={{ fontSize: 9, color: '#64748B', marginTop: 2 }}>
            Maximum Marks: {paper.total_marks} | Centaurus Academy Physics Faculty
          </Text>
        </View>

        {sections.map((sec, secIdx) => (
          <View key={secIdx}>
            <Text style={styles.sectionHeader}>{sec.label || `SECTION ${secIdx + 1}`}</Text>

            {sec.questions.map((q, qIdx) => {
              const currentNum = globalQNum++
              return (
                <View key={qIdx} style={styles.questionContainer} wrap={false}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNum}>Question {currentNum}</Text>
                    <Text style={styles.marksBadge}>[{q.marks} Marks]</Text>
                  </View>
                  <Text style={styles.questionText}>{q.question_text}</Text>
                  <View style={styles.answerBox}>
                    <Text style={styles.answerTitle}>Marking Scheme / Solution:</Text>
                    <Text style={{ fontSize: 9, color: '#15803D' }}>
                      {q.answer || '1 mark for correct formula, 1 mark for substitution, 1 mark for correct unit.'}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        ))}

        <View style={styles.footer}>
          <Text>Mark Scheme — {paper.title}</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            fixed
          />
        </View>
      </Page>
    </Document>
  )
}

/**
 * Export full exam paper to PDF Blob
 */
export async function exportPaper(paper: Paper): Promise<Blob> {
  const blob = await pdf(<ExamPaperPDFDocument paper={paper} />).toBlob()
  return blob
}

/**
 * Export mark scheme to PDF Blob
 */
export async function exportMarkScheme(paper: Paper): Promise<Blob> {
  const blob = await pdf(<MarkSchemePDFDocument paper={paper} />).toBlob()
  return blob
}
