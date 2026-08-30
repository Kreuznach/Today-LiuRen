import type { QueryType } from '../types'

type InferredQueryType = Exclude<QueryType, '기타'>

interface QuestionKeywordEntry {
  /** 활용형까지 함께 찾을 수 있는 낱말 또는 어간 */
  keywords: readonly string[]
  /** 낱말 하나로 판단하기 어려운 복합 표현 */
  phrases: readonly RegExp[]
}

/**
 * 질문 주제를 찾는 쉬운 말 사전.
 * 짧고 뜻이 여러 개인 말(일, 갈까, 물건 등)은 단독 키워드로 넣지 않는다.
 */
export const QUESTION_KEYWORDS: Record<InferredQueryType, QuestionKeywordEntry> = {
  연애: {
    keywords: [
      '연애', '사랑', '애정', '썸', '짝사랑', '호감', '고백', '재회', '이별', '헤어',
      '결혼', '이혼', '배우자', '남자친구', '여자친구', '남친', '여친', '애인', '연인',
      '소개팅', '데이트', '만남', '관계', '인연', '궁합', '약혼', '부부', '커플', '첫눈에',
    ],
    phrases: [
      /그\s*사람.*마음/, /상대.*마음/, /나를\s*(좋아|사랑)/,
      /(연락|답장).*(올까|올지|기다|없)/,
    ],
  },
  사업: {
    keywords: [
      '회사', '직장', '직업', '업무', '사업', '장사', '창업', '가게', '취업', '이직',
      '퇴사', '면접', '채용', '합격', '승진', '계약', '거래', '매출', '투자', '프로젝트',
      '시험', '진학', '진로', '학업', '성적', '자격증', '재물', '수익', '재테크', '주식',
      '대출',
    ],
    phrases: [
      /(돈|수입|월급|연봉).*(늘|오를|받|벌)/,
      /(손님|고객|매출).*(늘|줄|올|내릴)/,
      /(학교|대학|시험).*(붙|합격|성적)/,
    ],
  },
  분실물: {
    keywords: [
      '잃어버', '분실', '도난', '훔쳐', '도둑', '되찾', '사라졌', '없어졌', '두고 왔',
      '두고왔', '놓고 왔', '빠뜨', '행방', '안 보여', '못 찾', '찾을 수', '어딨',
    ],
    phrases: [
      /어디(에|쯤)?\s*(있|뒀|놓았|갔)/,
      /(지갑|열쇠|휴대폰|핸드폰|가방|반지|카드|서류).*(잃|사라|없|찾)/,
      /(잃|사라|없|찾).*(지갑|열쇠|휴대폰|핸드폰|가방|반지|카드|서류)/,
    ],
  },
  여행: {
    keywords: [
      '여행', '관광', '휴가', '출장', '이사', '이민', '유학', '이동', '출발', '귀국',
      '출국', '비행기', '항공권', '기차', '숙소', '예약', '여권', '여행지', '목적지',
      '떠나', '방문', '전근', '전학',
    ],
    phrases: [
      /(집|지역|도시|나라).*(옮기|이사|떠나)/,
      /(언제|내일|이번|다음).*(출발|떠나|여행)/,
      /(해외|국내|제주|서울|부산).*(가도|갈까|여행)/,
    ],
  },
  건강: {
    keywords: [
      '건강', '아프', '통증', '증상', '병원', '치료', '회복', '수술', '검사', '진단',
      '질병', '감기', '몸살', '컨디션', '수면', '불면', '운동', '다이어트', '임신',
      '출산', '복용', '부작용', '체중', '피곤', '피로', '스트레스', '약을', '약이',
    ],
    phrases: [
      /(몸|상처|병).*(낫|좋아|회복)/,
      /(머리|배|허리|목|다리|가슴).*(아프|통증|쑤시)/,
      /(잠|잠을).*(못|안|잘|깊이)/,
    ],
  },
}

export function scoreQuestionKeywords(question: string, queryType: InferredQueryType): number {
  const normalized = question.toLocaleLowerCase('ko-KR').replace(/\s+/g, ' ').trim()
  const entry = QUESTION_KEYWORDS[queryType]
  const keywordScore = entry.keywords.reduce(
    (score, keyword) => score + (normalized.includes(keyword) ? 1 : 0),
    0
  )
  const phraseScore = entry.phrases.reduce(
    (score, phrase) => score + (phrase.test(normalized) ? 2 : 0),
    0
  )
  return keywordScore + phraseScore
}