# Next.js Firebase Authentication Template

이 프로젝트는 Next.js와 Firebase를 사용하여 이메일 기반의 로그인, 회원가입, 메인 페이지, 그리고 프로필 페이지 기능을 제공하는 인증 템플릿입니다. 반응형 UI와 모듈화된 컴포넌트 구조, 널 체크 및 예외 처리를 적용하여 안정적인 코드를 목표로 합니다.

## 주요 기능

- **이메일 인증:** Firebase의 이메일/비밀번호 인증을 사용한 로그인 및 회원가입.
- **페이지 구성:** 로그인, 회원가입, 메인, 프로필 페이지 구현.
- **반응형 디자인:** 다양한 디바이스에서 최적화된 UI 제공.
- **글로벌 상태 관리:** React Context를 활용한 인증 상태 관리.
- **모듈화된 컴포넌트:** 재사용 가능한 `InputField`, `Button`, `AuthForm` 컴포넌트.
- **안정성:** 널 체크와 try-catch를 통한 예외 처리 구현.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 이상 권장)
- npm 또는 yarn 등 패키지 매니저
- Firebase 콘솔 계정 및 프로젝트 (이메일/비밀번호 인증 활성화 필요)

## Installation

1. **저장소 클론**
   ```bash
   git clone https://github.com/your-username/next-firebase-auth.git
   cd next-firebase-auth
