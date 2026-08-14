/**
 * features/reading/CourseDiagram.tsx
 * 나와 상대의 짝 네 개(사과)를 표 형태로 보여준다.
 */
import type { LiurenReading } from '../../domain/liuren/calculateLiurenReading'
import { branchLabel } from '../../domain/liuren/labels'

interface CourseDiagramProps {
  reading: LiurenReading
}

export default function CourseDiagram({ reading }: CourseDiagramProps) {
  return (
    <div className="course-diagram">
      <h3>🔍 상황을 네 칸으로 본 표</h3>
      <table className="course-table">
        <thead>
          <tr>
            <th>칸</th>
            <th>위 칸</th>
            <th>아래 칸</th>
          </tr>
        </thead>
        <tbody>
          {reading.fourLessons.map(course => (
            <tr key={course.index}>
              <td>{course.index}번째</td>
              <td>{branchLabel(course.heaven)}</td>
              <td>{branchLabel(course.earth)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="course-diagram-note">
        전체 모양 이름: {reading.raw.courseName} · 시작 칸을 고른 방법: {reading.raw.methodName}
        <br />
        옛날부터 쓰던 이름이라 어려워요. 뜻은 위의 해설에 쉬운 말로 담겨 있어요.
      </p>
    </div>
  )
}
