/**
 * features/reading/CourseDiagram.tsx
 * 과전도(課傳圖) — 사과(四課)를 표 형태로 보여준다.
 */
import type { LiurenReading } from '../../domain/liuren/calculateLiurenReading'
import { branchLabel } from '../../domain/liuren/labels'

interface CourseDiagramProps {
  reading: LiurenReading
}

export default function CourseDiagram({ reading }: CourseDiagramProps) {
  return (
    <div className="course-diagram">
      <h3>과전도 (四課)</h3>
      <table className="course-table">
        <thead>
          <tr>
            <th>과</th>
            <th>천반</th>
            <th>지반</th>
          </tr>
        </thead>
        <tbody>
          {reading.fourLessons.map(course => (
            <tr key={course.index}>
              <td>{course.index}과</td>
              <td>{branchLabel(course.heaven)}</td>
              <td>{branchLabel(course.earth)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="course-diagram-note">
        과체: {reading.raw.courseName} · 발용법: {reading.raw.methodName}
      </p>
    </div>
  )
}
