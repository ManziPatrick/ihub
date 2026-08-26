import { gql } from "@apollo/client";

export const CHAT_WITH_AI = gql`
  mutation ChatWithAI($message: String!) {
    chatWithAI(message: $message) {
      content
      role
      action
      actionData
    }
  }
`; export const EXPLAIN_TASK = gql`
  mutation ExplainTask($taskTitle: String!, $description: String!) {
    explainTask(taskTitle: $taskTitle, description: $description) {
      content
    }
  }
`;

export const REVIEW_SUBMISSION = gql`
  mutation ReviewSubmission($taskTitle: String!, $submissionContent: String!) {
    reviewSubmission(taskTitle: $taskTitle, submissionContent: $submissionContent) {
      content
    }
  }
`;

export const LOGIN_USER = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      requires2FA
      requires2FASetup
      user {
        id
        username
        email
        role
        permissions
        fullName
        avatar
        title
        bio
        phone
        location
        isFirst
        createdAt
        themePreference {
          primaryColor
          mode
          lightBg
          darkBg
        }
      }
    }
  }
`;

export const GOOGLE_LOGIN = gql`
  mutation GoogleLogin($token: String!) {
    googleLogin(token: $token) {
      token
      requires2FA
      requires2FASetup
      user {
        id
        username
        email
        role
        permissions
        fullName
        avatar
        title
        bio
        phone
        location
        isFirst
        createdAt
        themePreference {
          primaryColor
          mode
          lightBg
          darkBg
        }
      }
    }
  }
`;

export const REGISTER_USER = gql`
  mutation Register($username: String!, $email: String!, $password: String!) {
    register(username: $username, email: $email, password: $password) {
      token
      user {
        id
        username
        email
        role
        permissions
        fullName
        avatar
        title
        bio
        phone
        location
        isFirst
        createdAt
        themePreference {
          primaryColor
          mode
          lightBg
          darkBg
        }
      }
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($receiverId: ID!, $content: String!) {
    sendMessage(receiverId: $receiverId, content: $content) {
      id
      content
      sender {
         id
         username
      }
      createdAt
    }
  }
`;
export const ENROLL_COURSE = gql`
  mutation Enroll($courseId: ID!, $discountCode: String, $selectedDeliveryMode: String) {
    enroll(courseId: $courseId, discountCode: $discountCode, selectedDeliveryMode: $selectedDeliveryMode) {
      id
      studentsEnrolled {
        id
      }
    }
  }
`;

export const ENROLL_STUDENT_IN_COURSE = gql`
  mutation EnrollStudentInCourse($courseId: ID!, $userId: ID!) {
    enrollStudentInCourse(courseId: $courseId, userId: $userId) {
      id
      studentsEnrolled {
        id
        username
        email
      }
    }
  }
`;

export const CREATE_COURSE = gql`
  mutation CreateCourse($title: String!, $description: String!, $category: String!, $level: String, $thumbnail: String, $instructorId: ID!, $price: Float, $discountPrice: Float, $modules: [ModuleInput!]!, $submissionRequired: Boolean, $status: String, $enrollmentMode: String, $signerName: String, $signerSignature: String, $applicationQuestions: [ApplicationQuestionInput], $school: String) {
    createCourse(title: $title, description: $description, category: $category, level: $level, thumbnail: $thumbnail, instructorId: $instructorId, price: $price, discountPrice: $discountPrice, modules: $modules, submissionRequired: $submissionRequired, status: $status, enrollmentMode: $enrollmentMode, signerName: $signerName, signerSignature: $signerSignature, applicationQuestions: $applicationQuestions, school: $school) {
      id
      title
    }
  }
`;

export const UPDATE_COURSE = gql`
  mutation UpdateCourse($id: ID!, $title: String, $description: String, $thumbnail: String, $price: Float, $discountPrice: Float, $level: String, $category: String, $instructorId: ID, $status: String, $enrollmentMode: String, $submissionRequired: Boolean, $modules: [ModuleInput!], $signerName: String, $signerSignature: String, $applicationQuestions: [ApplicationQuestionInput], $school: String, $isFeatured: Boolean) {
    updateCourse(id: $id, title: $title, description: $description, thumbnail: $thumbnail, price: $price, discountPrice: $discountPrice, level: $level, category: $category, instructorId: $instructorId, status: $status, enrollmentMode: $enrollmentMode, submissionRequired: $submissionRequired, modules: $modules, signerName: $signerName, signerSignature: $signerSignature, applicationQuestions: $applicationQuestions, school: $school, isFeatured: $isFeatured) {
      id
      title
      status
      submissionRequired
      signerName
      signerSignature
      modules {
        id
        title
        description
        lessons {
          id
          title
          duration
          type
          videoUrl
          fileUrl
          content
          isAssignment
          requiredAssignment
          assignmentDescription
          assignmentDeliverables
          assignmentQuestions {
            id
            questionText
            type
            options
            correctOptionIndex
            points
          }
          assignmentConfig {
            timeLimit
            allowRetakes
            disableRightClick
            mode
          }
          quizQuestions {
            id
            questionText
            type
            imageUrl
            options
            correctOptionIndex
            explanation
            matchingPairs {
              id
              left
              right
            }
          }
          quizConfig {
            disableRightClick
            timeLimit
            quizType
            questionsPerPage
          }
          resources {
            id
            title
            url
            type
            source
            visibility
          }
          codeExercises {
            id
            title
            description
            language
            initialCode
            solutionCode
            testCode
            type
            setupCode
            expectedOutput
          }
          aiGradingGuide
        }
      }
    }
  }
`;

export const DELETE_COURSE = gql`
  mutation DeleteCourse($id: ID!) {
    deleteCourse(id: $id)
  }
`;
export const CREATE_USER = gql`
  mutation CreateUser($username: String!, $email: String!, $password: String!, $role: String, $permissions: [String], $school: String) {
    createUser(username: $username, email: $email, password: $password, role: $role, permissions: $permissions, school: $school) {
      id
      username
      email
      role
      permissions
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $username: String, $email: String, $password: String, $role: String, $permissions: [String], $fullName: String, $bio: String, $avatar: String, $coverImage: String, $phone: String, $location: String, $title: String, $certificateName: String, $isFirst: Boolean, $school: String, $status: String, $isProfilePublic: Boolean, $specialties: [String], $qualifications: [String], $linkedinProfile: String, $githubProfile: String, $websiteUrl: String, $rateHourly: Int, $experienceYears: Int, $teachingPhilosophy: String) {
    updateUser(id: $id, username: $username, email: $email, password: $password, role: $role, permissions: $permissions, fullName: $fullName, bio: $bio, avatar: $avatar, coverImage: $coverImage, phone: $phone, location: $location, title: $title, certificateName: $certificateName, isFirst: $isFirst, school: $school, status: $status, isProfilePublic: $isProfilePublic, specialties: $specialties, qualifications: $qualifications, linkedinProfile: $linkedinProfile, githubProfile: $githubProfile, websiteUrl: $websiteUrl, rateHourly: $rateHourly, experienceYears: $experienceYears, teachingPhilosophy: $teachingPhilosophy) {
      id
      username
      fullName
      email
      role
      bio
      avatar
      coverImage
      phone
      location
      title
      permissions
      certificateName
      isFirst
      school
      isProfilePublic
      trainerApplication {
        specialties
        experienceYears
        teachingPhilosophy
        qualifications
        rateHourly
        linkedinProfile
        githubProfile
        websiteUrl
        status
      }
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

export const COMPLETE_LESSON = gql`
  mutation CompleteLesson($courseId: ID!, $lessonId: String!) {
    completeLesson(courseId: $courseId, lessonId: $lessonId) {
      id
      completedLessons {
        courseId
        lessonId
      }
    }
  }
`;

export const UPDATE_COURSE_PROGRESS = gql`
  mutation UpdateCourseProgress($courseId: ID!, $lessonId: String!) {
    updateCourseProgress(courseId: $courseId, lessonId: $lessonId) {
      id
      courseProgress {
        courseId
        lessonId
        updatedAt
      }
    }
  }
`;

export const REWARD_STUDENT = gql`
  mutation RewardStudent($xp: Int!, $streak: Int, $courseId: ID, $lessonId: ID, $score: Int) {
    rewardStudent(xp: $xp, streak: $streak, courseId: $courseId, lessonId: $lessonId, score: $score) {
      id
      xp
      streak
      level
    }
  }
`;

export const GENERATE_AI_QUIZ = gql`
  mutation GenerateAIQuiz($courseId: ID, $lessonId: ID, $courseTitle: String, $lessonTitle: String, $lessonContent: String, $questionCount: Int, $prompt: String) {
    generateAIQuiz(courseId: $courseId, lessonId: $lessonId, courseTitle: $courseTitle, lessonTitle: $lessonTitle, lessonContent: $lessonContent, questionCount: $questionCount, prompt: $prompt) {
      id
      questionText
      options
      correctOptionIndex
      explanation
    }
  }
`;

export const HINT_FOR_QUESTION = gql`
  mutation HintForQuestion($questionText: String!, $options: [String!]!) {
    hintForQuestion(questionText: $questionText, options: $options)
  }
`;

export const GENERATE_QUESTION_EXPLANATION = gql`
  mutation GenerateQuestionExplanation($questionText: String!, $options: [String!]!, $correctOptionIndex: Int!) {
    generateQuestionExplanation(questionText: $questionText, options: $options, correctOptionIndex: $correctOptionIndex)
  }
`;

export const RUN_CODE = gql`
  mutation RunCode($code: String!, $language: String!, $testCode: String, $exerciseType: String, $setupCode: String, $exerciseTitle: String, $exerciseDescription: String, $expectedOutput: String, $exerciseId: String, $courseId: String) {
    runCode(code: $code, language: $language, testCode: $testCode, exerciseType: $exerciseType, setupCode: $setupCode, exerciseTitle: $exerciseTitle, exerciseDescription: $exerciseDescription, expectedOutput: $expectedOutput, exerciseId: $exerciseId, courseId: $courseId) {
      output
      passed
      testResults {
        name
        passed
        expected
        actual
        error
      }
      error
      generatedTestCode
    }
  }
`

export const GENERATE_EXERCISE_TESTS = gql`
  mutation GenerateExerciseTests($exerciseId: String!, $courseId: String, $title: String!, $description: String, $language: String!, $initialCode: String!, $setupCode: String, $expectedOutput: String) {
    generateExerciseTests(exerciseId: $exerciseId, courseId: $courseId, title: $title, description: $description, language: $language, initialCode: $initialCode, setupCode: $setupCode, expectedOutput: $expectedOutput) {
      testCode
      saved
    }
  }
`;

export const SAVE_CODE_EXERCISE_ANSWER = gql`
  mutation SaveCodeExerciseAnswer($courseId: ID!, $lessonId: ID!, $exerciseId: ID!, $code: String!) {
    saveCodeExerciseAnswer(courseId: $courseId, lessonId: $lessonId, exerciseId: $exerciseId, code: $code)
  }
`;

export const TRACK_ACTIVITY = gql`
  mutation TrackActivity($action: String!, $details: String) {
    trackActivity(action: $action, details: $details) {
      id
      activityLog {
        action
        details
        timestamp
      }
    }
  }
`;

export const CREATE_QUESTION = gql`
  mutation CreateQuestion($courseId: ID!, $lessonId: ID, $moduleNumber: String, $lessonNumber: String, $questionText: String!, $options: [String!]!, $correctOptionIndex: Int!, $explanation: String) {
    createQuestion(courseId: $courseId, lessonId: $lessonId, moduleNumber: $moduleNumber, lessonNumber: $lessonNumber, questionText: $questionText, options: $options, correctOptionIndex: $correctOptionIndex, explanation: $explanation) {
      id
      questionText
      moduleNumber
      lessonNumber
    }
  }
`;

export const UPDATE_QUESTION = gql`
  mutation UpdateQuestion($id: ID!, $moduleNumber: String, $lessonNumber: String, $questionText: String, $options: [String!], $correctOptionIndex: Int, $explanation: String) {
    updateQuestion(id: $id, moduleNumber: $moduleNumber, lessonNumber: $lessonNumber, questionText: $questionText, options: $options, correctOptionIndex: $correctOptionIndex, explanation: $explanation) {
      id
      questionText
      moduleNumber
      lessonNumber
    }
  }
`;

export const DELETE_QUESTION = gql`
  mutation DeleteQuestion($id: ID!) {
    deleteQuestion(id: $id)
  }
`;

export const CREATE_BOOKING = gql`
  mutation CreateBooking($mentorId: ID, $type: String!, $date: String!, $time: String!, $topic: String, $notes: String, $meetingLink: String, $contextType: String, $contextTitle: String) {
    createBooking(mentorId: $mentorId, type: $type, date: $date, time: $time, topic: $topic, notes: $notes, meetingLink: $meetingLink, contextType: $contextType, contextTitle: $contextTitle) {
      id
      status
      meetingLink
      contextType
      contextTitle
    }
  }
`;

export const UPDATE_BOOKING_STATUS = gql`
  mutation UpdateBookingStatus($id: ID!, $status: String!, $meetingLink: String) {
    updateBookingStatus(id: $id, status: $status, meetingLink: $meetingLink) {
      id
      status
      meetingLink
    }
  }
`;

export const AWARD_BADGE = gql`
  mutation AwardBadge($userId: ID!, $badgeId: ID!) {
    awardBadge(userId: $userId, badgeId: $badgeId) {
      id
      badges {
        badge {
          id
          title
        }
      }
    }
  }
`;

export const SUBMIT_GRADE = gql`
  mutation SubmitGrade($userId: ID!, $courseId: ID!, $lessonId: String, $score: Int!, $feedback: String) {
    submitGrade(userId: $userId, courseId: $courseId, lessonId: $lessonId, score: $score, feedback: $feedback) {
      id
      grades {
        courseId
        score
      }
    }
  }
`;

export const PROMOTE_STUDENT = gql`
  mutation PromoteStudent($userId: ID!, $academicStatus: String!, $level: Int) {
    promoteStudent(userId: $userId, academicStatus: $academicStatus, level: $level) {
      id
      level
      academicStatus
    }
  }
`;

export const CREATE_BADGE = gql`
  mutation CreateBadge($title: String!, $description: String!, $icon: String, $category: String) {
    createBadge(title: $title, description: $description, icon: $icon, category: $category) {
      id
      title
      description
      icon
      category
    }
  }
`;

export const UPDATE_BADGE = gql`
  mutation UpdateBadge($id: ID!, $title: String, $description: String, $icon: String, $category: String) {
    updateBadge(id: $id, title: $title, description: $description, icon: $icon, category: $category) {
      id
      title
      description
      icon
      category
    }
  }
`;

export const DELETE_BADGE = gql`
  mutation DeleteBadge($id: ID!) {
    deleteBadge(id: $id)
  }
`;

export const UPDATE_CONFIG = gql`
  mutation UpdateConfig($key: String!, $value: String!, $description: String) {
    updateConfig(key: $key, value: $value, description: $description) {
      id
      key
      value
    }
  }
`;

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`;

export const UPDATE_TASK_PROGRESS = gql`
  mutation UpdateTaskProgress($projectId: ID!, $taskId: String!, $completed: Boolean!) {
    updateTaskProgress(projectId: $projectId, taskId: $taskId, completed: $completed) {
      id
      progress
      tasks {
        id
        title
        completed
        approved
        feedback
      }
    }
  }
`;

export const APPROVE_PROJECT_TASK = gql`
  mutation ApproveProjectTask($id: ID!, $feedback: String) {
    approveProjectTask(id: $id, feedback: $feedback) {
      id
      title
      status
      approved
      feedback
      assignee {
        id
        username
        fullName
        avatar
      }
    }
  }
`;

export const CREATE_PROJECT = gql`
  mutation CreateProject(
    $title: String!
    $course: String!
    $type: String!
    $description: String!
    $deadline: String
    $userId: ID
    $mentorIds: [ID]
    $team: [TeamMemberInput]
    $tasks: [TaskInput]
    $documentation: DocumentationInput
  ) {
    createProject(
      title: $title
      course: $course
      type: $type
      description: $description
      deadline: $deadline
      userId: $userId
      mentorIds: $mentorIds
      team: $team
      tasks: $tasks
      documentation: $documentation
    ) {
      id
      title
      status
    }
  }
`;

export const UPDATE_PROJECT = gql`
  mutation UpdateProject(
    $id: ID!
    $title: String
    $course: String
    $type: String
    $status: String
    $progress: Int
    $deadline: String
    $submittedAt: String
    $grade: String
    $feedback: String
    $description: String
    $submissionUrl: String
    $documentation: DocumentationInput
  ) {
    updateProject(
      id: $id
      title: $title
      course: $course
      type: $type
      status: $status
      progress: $progress
      deadline: $deadline
      submittedAt: $submittedAt
      grade: $grade
      feedback: $feedback
      description: $description
      submissionUrl: $submissionUrl
      documentation: $documentation
    ) {
      id
      title
      status
      progress
    }
  }
`;

export const SUBMIT_PROJECT = gql`
  mutation SubmitProject($id: ID!, $submissionUrl: String!) {
    submitProject(id: $id, submissionUrl: $submissionUrl) {
      id
      status
      progress
      submittedAt
      submissionUrl
    }
  }
`;

export const GRADE_PROJECT = gql`
  mutation GradeProject($id: ID!, $grade: String!, $feedback: String!) {
    gradeProject(id: $id, grade: $grade, feedback: $feedback) {
      id
      status
      grade
      feedback
      progress
    }
  }
`;

export const UPDATE_CERTIFICATE = gql`
  mutation UpdateCertificate(
    $id: ID!
    $status: String
    $progress: Int
    $issueDate: String
    $credentialId: String
  ) {
    updateCertificate(
      id: $id
      status: $status
      progress: $progress
      issueDate: $issueDate
      credentialId: $credentialId
    ) {
      id
      status
      progress
      issueDate
      credentialId
    }
  }
`;

export const ISSUE_CERTIFICATE = gql`
  mutation IssueCertificate($id: ID!, $credentialId: String!) {
    issueCertificate(id: $id, credentialId: $credentialId) {
      id
      status
      issueDate
      credentialId
    }
  }
`;

export const UPDATE_CERTIFICATE_NAME = gql`
  mutation UpdateCertificateRecipientName($id: ID!, $recipientName: String!) {
    updateCertificateRecipientName(id: $id, recipientName: $recipientName) {
      id
      recipientName
    }
  }
`;

export const UPDATE_INTERNSHIP = gql`
  mutation UpdateInternship(
    $id: ID!
    $title: String
    $organization: String
    $company: String
    $startDate: String
    $endDate: String
    $duration: String
    $type: String
    $status: String
    $stage: String
    $cohort: String
    $projects: [ID]
    $progress: Int
    $mentorId: ID
    $mentorIds: [ID]
  ) {
    updateInternship(
      id: $id
      title: $title
      organization: $organization
      company: $company
      startDate: $startDate
      endDate: $endDate
      duration: $duration
      type: $type
      status: $status
      stage: $stage
      cohort: $cohort
      projects: $projects
      progress: $progress
      mentorId: $mentorId
      mentorIds: $mentorIds
    ) {
      id
      title
      organization
      status
      stage
      cohort
      progress
      mentor {
        id
        username
      }
      projects {
        id
        title
      }
    }
  }
`;

export const CREATE_INTERNSHIP = gql`
  mutation CreateInternship(
    $userId: ID!
    $title: String!
    $organization: String
    $company: String
    $duration: String!
    $type: String!
    $payment: PaymentInput
    $startDate: String
    $endDate: String
    $mentorId: ID
    $stage: String
    $cohort: String
    $projects: [ID]
    $academicSchool: String
    $academicLevel: String
    $previousLanguages: String
    $skills: String
    $phoneNumber: String
    $portfolioUrl: String
    $mentorIds: [ID]
  ) {
    createInternship(
      userId: $userId
      title: $title
      organization: $organization
      company: $company
      duration: $duration
      type: $type
      payment: $payment
      startDate: $startDate
      endDate: $endDate
      mentorId: $mentorId
      stage: $stage
      cohort: $cohort
      projects: $projects
      academicSchool: $academicSchool
      academicLevel: $academicLevel
      previousLanguages: $previousLanguages
      skills: $skills
      phoneNumber: $phoneNumber
      portfolioUrl: $portfolioUrl
      mentorIds: $mentorIds
    ) {
      id
      title
      cohort
      user {
        id
        username
      }
      status
    }
  }
`;

export const UPDATE_INTERNSHIP_PAYMENT = gql`
  mutation UpdateInternshipPayment($id: ID!, $status: String!, $paidAt: String) {
    updateInternshipPayment(id: $id, status: $status, paidAt: $paidAt) {
      id
      payment {
        status
        paidAt
      }
      status
    }
  }
`;

export const DELETE_INTERNSHIP = gql`
  mutation DeleteInternship($id: ID!) {
    deleteInternship(id: $id)
  }
`;

export const PAY_FOR_COURSE = gql`
  mutation PayForCourse($courseId: ID!, $amount: Float!, $paymentMethod: String!, $selectedDeliveryMode: String) {
    payForCourse(courseId: $courseId, amount: $amount, paymentMethod: $paymentMethod, selectedDeliveryMode: $selectedDeliveryMode) {
      id
      status
      amount
      currency
      selectedDeliveryMode
    }
  }
`;
export const PROMOTE_INTERN = gql`
  mutation PromoteIntern($id: ID, $groupId: String, $cohort: String, $targetStage: Int!) {
    promoteIntern(id: $id, groupId: $groupId, cohort: $cohort, targetStage: $targetStage)
  }
`;

export const UPDATE_INTERNSHIP_STAGE = gql`
  mutation UpdateInternshipStage($id: ID!, $stage: String!, $currentStage: Int!) {
    updateInternshipStage(id: $id, stage: $stage, currentStage: $currentStage) {
      id
      stage
      currentStage
      progress
      status
    }
  }
`;

export const SUBMIT_STANDUP = gql`
  mutation SubmitStandup($internshipId: ID!, $yesterday: String!, $today: String!, $blockers: String, $workLink: String) {
    submitStandup(internshipId: $internshipId, yesterday: $yesterday, today: $today, blockers: $blockers, workLink: $workLink) {
      id
      yesterday
      today
      blockers
      workLink
      attendanceStatus
      date
    }
  }
`;

export const GRADE_SPRINT_MILESTONE = gql`
  mutation GradeSprintMilestone($internshipId: ID!, $week: Int!, $grade: Int!, $feedback: String!) {
    gradeSprintMilestone(internshipId: $internshipId, week: $week, grade: $grade, feedback: $feedback) {
      id
      sprintReviews {
        week
        grade
        feedback
      }
    }
  }
`;

export const SCHEDULE_MEETING = gql`
  mutation ScheduleMeeting($internshipId: ID!, $title: String!, $time: String!, $type: String!, $url: String, $attendees: [String]) {
    scheduleMeeting(internshipId: $internshipId, title: $title, time: $time, type: $type, url: $url, attendees: $attendees) {
      id
      meetings {
        title
        time
        type
        url
        attendees
      }
    }
  }
`;

export const ADD_INTERNSHIP_TASK = gql`
  mutation AddInternshipTask($internshipId: ID!, $title: String!, $priority: String) {
    addInternshipTask(internshipId: $internshipId, title: $title, priority: $priority) {
      id
      progress
      tasks {
        id
        title
        status
        priority
      }
    }
  }
`;

export const UPDATE_INTERNSHIP_TASK_LEGACY = gql`
  mutation UpdateInternshipTaskLegacy($internshipId: ID!, $taskId: ID!, $status: String!) {
    updateInternshipTaskLegacy(internshipId: $internshipId, taskId: $taskId, status: $status) {
      id
      progress
      tasks {
        id
        title
        status
        priority
      }
    }
  }
`;

export const ASSIGN_GROUP_PROJECT = gql`
  mutation AssignGroupProject($internshipIds: [ID!], $title: String!, $description: String!, $repoUrl: String, $deadline: String, $mentorIds: [ID!]) {
    assignGroupProject(internshipIds: $internshipIds, title: $title, description: $description, repoUrl: $repoUrl, deadline: $deadline, mentorIds: $mentorIds) {
      id
      title
      status
      type
      team {
        name
        role
      }
    }
  }
`;

export const ADD_BATCH_TASK = gql`
  mutation AddBatchTask($internshipIds: [ID!], $stage: Int, $cohort: String, $title: String!, $priority: String) {
    addBatchTask(internshipIds: $internshipIds, stage: $stage, cohort: $cohort, title: $title, priority: $priority)
  }
`;
export const UPDATE_BRANDING = gql`
  mutation UpdateBranding(
    $primaryColor: String
    $secondaryColor: String
    $accentColor: String
    $logoUrl: String
    $siteName: String
    $portalTitle: String
  ) {
    updateBranding(
      primaryColor: $primaryColor
      secondaryColor: $secondaryColor
      accentColor: $accentColor
      logoUrl: $logoUrl
      siteName: $siteName
      portalTitle: $portalTitle
    ) {
      primaryColor
      secondaryColor
      accentColor
      logoUrl
      siteName
      portalTitle
    }
  }
`;
export const UPDATE_THEME = gql`
  mutation UpdateTheme($primaryColor: String, $mode: String, $lightBg: String, $darkBg: String) {
    updateTheme(primaryColor: $primaryColor, mode: $mode, lightBg: $lightBg, darkBg: $darkBg) {
      id
      themePreference {
        primaryColor
        mode
        lightBg
        darkBg
      }
    }
  }
`;

export const SEND_TEST_EMAIL = gql`
  mutation SendTestEmail($to: String!) {
    sendTestEmail(to: $to)
  }
`;

export const SEND_MESSAGE_TO_PROJECT = gql`
  mutation SendMessageToProject($projectId: ID!, $content: String!) {
    sendMessageToProject(projectId: $projectId, content: $content) {
      id
      content
      createdAt
      conversationId
      sender {
         id
         username
      }
    }
  }
`;
// --- New Internship Module Mutations ---

export const CREATE_INTERNSHIP_PROGRAM = gql`
  mutation CreateInternshipProgram($title: String!, $organization: String, $organizationLogo: String, $description: String!, $duration: String!, $startDate: String!, $endDate: String!, $applicationDeadline: String!, $eligibility: String, $rules: String, $price: Float, $currency: String, $image: String, $applicationQuestions: [ApplicationQuestionInput], $signerName: String, $signerSignature: String, $maxSpots: Int, $discount: Float) {
    createInternshipProgram(title: $title, organization: $organization, organizationLogo: $organizationLogo, description: $description, duration: $duration, startDate: $startDate, endDate: $endDate, applicationDeadline: $applicationDeadline, eligibility: $eligibility, rules: $rules, price: $price, currency: $currency, image: $image, applicationQuestions: $applicationQuestions, signerName: $signerName, signerSignature: $signerSignature, maxSpots: $maxSpots, discount: $discount) {
      id
      title
      image
      signerName
      signerSignature
      maxSpots
      discount
      eligibility
      rules
      applicationQuestions {
        label
        type
        required
        options
      }
    }
  }
`;

export const UPDATE_INTERNSHIP_PROGRAM_NEW = gql`
  mutation UpdateInternshipProgram($id: ID!, $title: String, $organization: String, $organizationLogo: String, $description: String, $duration: String, $startDate: String, $endDate: String, $applicationDeadline: String, $status: String, $eligibility: String, $rules: String, $price: Float, $discount: Float, $currency: String, $image: String, $maxSpots: Int, $applicationQuestions: [ApplicationQuestionInput]) {
    updateInternshipProgram(id: $id, title: $title, organization: $organization, organizationLogo: $organizationLogo, description: $description, duration: $duration, startDate: $startDate, endDate: $endDate, applicationDeadline: $applicationDeadline, status: $status, eligibility: $eligibility, rules: $rules, price: $price, discount: $discount, currency: $currency, image: $image, maxSpots: $maxSpots, applicationQuestions: $applicationQuestions) {
      id
      title
      status
      price
      discount
      maxSpots
      image
      startDate
      endDate
      applicationDeadline
      applicationQuestions {
        label
        type
        required
        options
      }
    }
  }
`;

export const DELETE_INTERNSHIP_PROGRAM_NEW = gql`
  mutation DeleteInternshipProgram($id: ID!) {
    deleteInternshipProgram(id: $id)
  }
`;

export const APPLY_TO_COURSE = gql`
  mutation ApplyToCourse($courseId: ID!, $applicationAnswers: [ApplicationAnswerInput], $selectedDeliveryMode: String) {
    applyToCourse(courseId: $courseId, applicationAnswers: $applicationAnswers, selectedDeliveryMode: $selectedDeliveryMode) {
      id
      status
    }
  }
`;

export const UPDATE_COURSE_APPLICATION_STATUS = gql`
  mutation UpdateCourseApplicationStatus($applicationId: ID!, $status: String!, $rejectionReason: String) {
    updateCourseApplicationStatus(applicationId: $applicationId, status: $status, rejectionReason: $rejectionReason) {
      id
      status
      rejectionReason
      user {
        id
        username
        fullName
        email
      }
      course {
        id
        title
      }
      createdAt
    }
  }
`;

export const APPLY_TO_INTERNSHIP_PROGRAM = gql`
  mutation ApplyToInternshipProgram($internshipProgramId: ID!, $skills: [String!]!, $availability: String!, $portfolioUrl: String, $applicationAnswers: [ApplicationAnswerInput]) {
    applyToInternshipProgram(internshipProgramId: $internshipProgramId, skills: $skills, availability: $availability, portfolioUrl: $portfolioUrl, applicationAnswers: $applicationAnswers) {
      id
      status
      payment {
        id
        status
        amount
        currency
      }
      applicationAnswers {
        questionLabel
        answer
      }
    }
  }
`;

export const REVIEW_INTERNSHIP_APPLICATION = gql`
  mutation ReviewInternshipApplication($id: ID!, $status: String!, $rejectionReason: String) {
    reviewInternshipApplication(id: $id, status: $status, rejectionReason: $rejectionReason) {
      id
      status
    }
  }
`;

export const CREATE_INTERNSHIP_PROJECT_NEW = gql`
  mutation CreateInternshipProject($title: String!, $description: String!, $document: String, $requiredSkills: [String!]!, $minTeamSize: Int!, $maxTeamSize: Int!, $internshipProgramId: ID!, $defaultTickets: [DefaultTicketInput], $documentation: DocumentationInput) {
    createInternshipProject(title: $title, description: $description, document: $document, requiredSkills: $requiredSkills, minTeamSize: $minTeamSize, maxTeamSize: $maxTeamSize, internshipProgramId: $internshipProgramId, defaultTickets: $defaultTickets, documentation: $documentation) {
      id
      title
    }
  }
`;

export const UPDATE_INTERNSHIP_PROJECT_NEW = gql`
  mutation UpdateInternshipProject($id: ID!, $title: String, $description: String, $document: String, $requiredSkills: [String], $minTeamSize: Int, $maxTeamSize: Int, $status: String, $defaultTickets: [DefaultTicketInput], $documentation: DocumentationInput) {
    updateInternshipProject(id: $id, title: $title, description: $description, document: $document, requiredSkills: $requiredSkills, minTeamSize: $minTeamSize, maxTeamSize: $maxTeamSize, status: $status, defaultTickets: $defaultTickets, documentation: $documentation) {
      id
      title
    }
  }
`;

export const DELETE_INTERNSHIP_PROJECT = gql`
  mutation DeleteInternshipProject($id: ID!) {
    deleteInternshipProject(id: $id)
  }
`;

export const CREATE_INTERNSHIP_TEAM_NEW = gql`
  mutation CreateInternshipTeam($name: String!, $internshipProjectId: ID!, $internshipProgramId: ID!, $mentorId: ID, $type: String) {
    createInternshipTeam(name: $name, internshipProjectId: $internshipProjectId, internshipProgramId: $internshipProgramId, mentorId: $mentorId, type: $type) {
      id
      name
      type
      status
    }
  }
`;

export const ADD_INTERN_TO_TEAM_NEW = gql`
  mutation AddInternToTeam($teamId: ID!, $userId: ID!, $role: String!) {
    addInternToTeam(teamId: $teamId, userId: $userId, role: $role) {
      id
      role
    }
  }
`;

export const REMOVE_INTERN_FROM_TEAM_NEW = gql`
  mutation RemoveInternFromTeam($teamMemberId: ID!) {
    removeInternFromTeam(teamMemberId: $teamMemberId)
  }
`;

export const CREATE_INTERNSHIP_MILESTONE_NEW = gql`
  mutation CreateInternshipMilestone($internshipProjectId: ID!, $title: String!, $deadline: String!, $order: Int!) {
    createInternshipMilestone(internshipProjectId: $internshipProjectId, title: $title, deadline: $deadline, order: $order) {
      id
      title
    }
  }
`;

export const SUBMIT_INTERNSHIP_WORK = gql`
  mutation SubmitInternshipWork($teamId: ID!, $milestoneId: ID!, $contentUrl: String!, $description: String!) {
    submitInternshipWork(teamId: $teamId, milestoneId: $milestoneId, contentUrl: $contentUrl, description: $description) {
      id
      status
    }
  }
`;


export const LOG_INTERNSHIP_TIME = gql`
  mutation LogInternshipTime($teamId: ID!, $description: String!, $minutes: Int!, $date: String!) {
    logInternshipTime(teamId: $teamId, description: $description, minutes: $minutes, date: $date) {
      id
      minutes
      description
      date
    }
  }
`;

export const REVIEW_INTERNSHIP_SUBMISSION_NEW = gql`
  mutation ReviewInternshipSubmission($id: ID!, $status: String!, $feedback: String) {
    reviewInternshipSubmission(id: $id, status: $status, feedback: $feedback) {
      id
      status
    }
  }
`;

export const SUBMIT_MENTOR_FEEDBACK_NEW = gql`
  mutation SubmitMentorFeedback($userId: ID!, $teamId: ID!, $score: Int!, $feedback: String!) {
    submitMentorFeedback(userId: $userId, teamId: $teamId, score: $score, feedback: $feedback) {
      id
      score
    }
  }
`;

// ========== STUDENT PROFILE MUTATIONS ==========
export const CREATE_STUDENT_PROFILE = gql`
  mutation CreateStudentProfile(
    $school: String!
    $educationLevel: String!
    $academicYear: String
    $fieldOfStudy: String
    $city: String
    $sector: String
    $cell: String
    $village: String
    $skills: [String!]!
    $availability: String!
    $bio: String
    $linkedinUrl: String
    $githubUrl: String
    $portfolioUrl: String
  ) {
    createStudentProfile(
      school: $school
      educationLevel: $educationLevel
      academicYear: $academicYear
      fieldOfStudy: $fieldOfStudy
      city: $city
      sector: $sector
      cell: $cell
      village: $village
      skills: $skills
      availability: $availability
      bio: $bio
      linkedinUrl: $linkedinUrl
      githubUrl: $githubUrl
      portfolioUrl: $portfolioUrl
    ) {
      id
      completionPercentage
      isComplete
    }
  }
`;

export const UPDATE_STUDENT_PROFILE = gql`
  mutation UpdateStudentProfile(
    $school: String
    $educationLevel: String
    $academicYear: String
    $fieldOfStudy: String
    $city: String
    $sector: String
    $cell: String
    $village: String
    $skills: [String]
    $availability: String
    $bio: String
    $linkedinUrl: String
    $githubUrl: String
    $portfolioUrl: String
  ) {
    updateStudentProfile(
      school: $school
      educationLevel: $educationLevel
      academicYear: $academicYear
      fieldOfStudy: $fieldOfStudy
      city: $city
      sector: $sector
      cell: $cell
      village: $village
      skills: $skills
      availability: $availability
      bio: $bio
      linkedinUrl: $linkedinUrl
      githubUrl: $githubUrl
      portfolioUrl: $portfolioUrl
    ) {
      id
      completionPercentage
      isComplete
    }
  }
`;

export const VALIDATE_PROFILE_FOR_INTERNSHIP = gql`
  mutation ValidateProfileForInternship {
    validateProfileForInternship {
      isValid
      missingFields
      completionPercentage
      message
    }
  }
`;

export const APPLY_TO_INTERNSHIP_WITH_VALIDATION = gql`
  mutation ApplyToInternshipWithValidation(
    $internshipProgramId: ID!
    $skills: [String!]!
    $availability: String!
    $portfolioUrl: String
    $applicationAnswers: [ApplicationAnswerInput]
  ) {
    applyToInternshipWithValidation(
      internshipProgramId: $internshipProgramId
      skills: $skills
      availability: $availability
      portfolioUrl: $portfolioUrl
      applicationAnswers: $applicationAnswers
    ) {
      id
      status
    }
  }
`;

// ========== PAYMENT MUTATIONS ==========
export const CREATE_INTERNSHIP_PAYMENT = gql`
  mutation CreateInternshipPayment($internshipProgramId: ID!, $amount: Float!, $currency: String) {
    createInternshipPayment(internshipProgramId: $internshipProgramId, amount: $amount, currency: $currency) {
      id
      status
      amount
      currency
    }
  }
`;

export const PROCESS_INTERNSHIP_PAYMENT = gql`
  mutation ProcessInternshipPayment($paymentId: ID!, $transactionId: String!, $paymentMethod: String!) {
    processInternshipPayment(paymentId: $paymentId, transactionId: $transactionId, paymentMethod: $paymentMethod) {
      id
      status
      paidAt
    }
  }
`;

export const WAIVE_INTERNSHIP_PAYMENT = gql`
  mutation WaiveInternshipPayment($paymentId: ID!, $reason: String!) {
    waiveInternshipPayment(paymentId: $paymentId, reason: $reason) {
      id
      status
      waivedReason
    }
  }
`;

export const REFUND_INTERNSHIP_PAYMENT = gql`
  mutation RefundInternshipPayment($paymentId: ID!, $reason: String!) {
    refundInternshipPayment(paymentId: $paymentId, reason: $reason) {
      id
      status
    }
  }
`;

export const GENERATE_INTERNSHIP_INVOICE = gql`
  mutation GenerateInternshipInvoice($paymentId: ID!) {
    generateInternshipInvoice(paymentId: $paymentId) {
      id
      invoiceNumber
      amount
      currency
      issuedAt
      dueDate
      status
    }
  }
`;

// ========== CERTIFICATE MUTATIONS ==========
export const CHECK_CERTIFICATE_ELIGIBILITY = gql`
  mutation CheckCertificateEligibility($teamId: ID!) {
    checkCertificateEligibility(teamId: $teamId) {
      isEligible
      milestonesCompleted
      trainerApproved
      paymentConfirmed
      message
    }
  }
`;

export const GENERATE_INTERNSHIP_CERTIFICATE = gql`
  mutation GenerateInternshipCertificate($userId: ID!, $teamId: ID!, $trainerId: ID!) {
    generateInternshipCertificate(userId: $userId, teamId: $teamId, trainerId: $trainerId) {
      id
      certificateNumber
      issuedAt
      verificationUrl
    }
  }
`;

export const REVOKE_CERTIFICATE = gql`
  mutation RevokeCertificate($certificateId: ID!, $reason: String!) {
    revokeCertificate(certificateId: $certificateId, reason: $reason) {
      id
      isRevoked
      revokedAt
      revocationReason
    }
  }
`;

export const APPROVE_INTERN_FOR_CERTIFICATE = gql`
  mutation ApproveInternForCertificate($userId: ID!, $teamId: ID!, $finalGrade: String!) {
    approveInternForCertificate(userId: $userId, teamId: $teamId, finalGrade: $finalGrade) {
      id
      score
    }
  }
`;

export const APPROVE_MILESTONE = gql`
  mutation ApproveMilestone($milestoneId: ID!, $teamId: ID!) {
    approveMilestone(milestoneId: $milestoneId, teamId: $teamId) {
      id
      title
    }
  }
`;

export const CREATE_STRIPE_PAYMENT_INTENT = gql`
  mutation CreateStripePaymentIntent($programId: ID!) {
    createStripePaymentIntent(programId: $programId) {
      clientSecret
      paymentIntentId
      publishableKey
      paymentId
    }
  }
`;
export const UPDATE_INTERNSHIP_TEAM_NEW = gql`
  mutation UpdateInternshipTeam($id: ID!, $name: String, $mentorId: ID, $status: String, $type: String) {
    updateInternshipTeam(id: $id, name: $name, mentorId: $mentorId, status: $status, type: $type) {
      id
      name
      status
      type
    }
  }
`;

export const DELETE_INTERNSHIP_TEAM_NEW = gql`
  mutation DeleteInternshipTeam($id: ID!) {
    deleteInternshipTeam(id: $id)
  }
`;
export const SUBSCRIBE_TO_NEWSLETTER = gql`
  mutation SubscribeToNewsletter($email: String!) {
    subscribeToNewsletter(email: $email)
  }
`;

export const CREATE_RESOURCE = gql`
  mutation CreateResource($input: ResourceInput!) {
    createResource(input: $input) {
      id
      title
      type
      source
      url
      linkedTo
      onModel
      visibility
      createdAt
      createdBy {
        id
        username
      }
    }
  }
`;

export const UPDATE_RESOURCE = gql`
  mutation UpdateResource($id: ID!, $input: ResourceInput!) {
    updateResource(id: $id, input: $input) {
      id
      title
      url
    }
  }
`;

export const DELETE_RESOURCE = gql`
  mutation DeleteResource($id: ID!) {
    deleteResource(id: $id)
  }
`;

export const SUBMIT_CLIENT_EVALUATION = gql`
  mutation SubmitClientEvaluation($projectId: ID!, $rating: Int!, $comment: String!) {
    submitClientEvaluation(projectId: $projectId, rating: $rating, comment: $comment) {
      id
      evaluation {
        clientFeedback {
          rating
          comment
          submittedAt
        }
      }
    }
  }
`;

export const RESTORE_PROJECT_APPLICATION = gql`
  mutation RestoreProjectApplication($applicationId: ID!) {
    restoreProjectApplication(applicationId: $applicationId) {
      id
      title
      status
    }
  }
`;

export const RESTORE_BOOKING = gql`
  mutation RestoreBooking($id: ID!) {
    restoreBooking(id: $id) {
      id
      status
    }
  }
`;

export const RESTORE_COURSE = gql`
  mutation RestoreCourse($id: ID!) {
    restoreCourse(id: $id) {
      id
      title
      status
    }
  }
`;

export const RESTORE_USER = gql`
  mutation RestoreUser($id: ID!) {
    restoreUser(id: $id) {
      id
      username
      email
      role
    }
  }
`;

export const RESTORE_BADGE = gql`
  mutation RestoreBadge($id: ID!) {
    restoreBadge(id: $id) {
      id
      title
    }
  }
`;

export const RESTORE_PROJECT = gql`
  mutation RestoreProject($id: ID!) {
    restoreProject(id: $id) {
      id
      title
      status
    }
  }
`;

export const DELETE_PROJECT_APPLICATION = gql`
  mutation DeleteProjectApplication($applicationId: ID!) {
    deleteProjectApplication(applicationId: $applicationId) {
      id
      title
      status
    }
  }
`;

export const UPDATE_PROJECT_APPLICATION = gql`
  mutation UpdateProjectApplication(
    $applicationId: ID!
    $title: String
    $description: String
    $documents: ProjectApplicationDocumentsInput
  ) {
    updateProjectApplication(applicationId: $applicationId, title: $title, description: $description, documents: $documents) {
      id
      title
      description
      status
      requiredDocuments {
        overviewUrl
        featuresUrl
        technicalUrl
      }
    }
  }
`;

export const CANCEL_BOOKING = gql`
  mutation CancelBooking($id: ID!) {
    cancelBooking(id: $id) {
      id
      status
    }
  }
`;

export const SUBMIT_MILESTONE_DELIVERABLE = gql`
  mutation SubmitMilestoneDeliverable($projectId: ID!, $milestoneIndex: Int!, $fileUrl: String!, $fileName: String!, $message: String!) {
    submitMilestoneDeliverable(projectId: $projectId, milestoneIndex: $milestoneIndex, fileUrl: $fileUrl, fileName: $fileName, message: $message) {
      id
      milestones {
        title
        completed
        submissions {
          url
          fileName
          version
          message
          status
          feedback
        }
      }
    }
  }
`;

export const SUBMIT_ASSIGNMENT = gql`
  mutation SubmitAssignment($courseId: ID!, $lessonId: String!, $content: String!) {
    submitAssignment(courseId: $courseId, lessonId: $lessonId, content: $content) {
      id
      content
      status
      grade
      feedback
      createdAt
    }
  }
`;

export const SUBMIT_ASSIGNMENT_EXAM = gql`
  mutation SubmitAssignmentExam($courseId: ID!, $lessonId: String!, $answers: [AssignmentAnswerInput!]!, $timeTaken: Int) {
    submitAssignmentExam(courseId: $courseId, lessonId: $lessonId, answers: $answers, timeTaken: $timeTaken) {
      id
      grade
      totalScore
      status
      answers {
        questionId
        answerText
        score
        aiFeedback
      }
    }
  }
`;

export const GRADE_ASSIGNMENT = gql`
  mutation GradeAssignment($submissionId: ID!, $grade: Int!, $feedback: String, $questionScores: [QuestionScoreInput]) {
    gradeAssignment(submissionId: $submissionId, grade: $grade, feedback: $feedback, questionScores: $questionScores) {
      id
      status
      grade
      feedback
      answers {
        questionId
        answerText
        score
        aiFeedback
      }
    }
  }
`;

export const GRADE_ASSIGNMENT_QUESTIONS = gql`
  mutation GradeAssignmentQuestions($submissionId: ID!, $questionScores: [QuestionScoreInput!]!) {
    gradeAssignment(submissionId: $submissionId, grade: 0, feedback: "", questionScores: $questionScores) {
      id
      status
      grade
      feedback
      answers {
        questionId
        answerText
        score
        aiFeedback
      }
    }
  }
`;

export const PING_INSTRUCTOR = gql`
  mutation PingInstructor($submissionId: ID!, $message: String) {
    pingInstructor(submissionId: $submissionId, message: $message)
  }
`;

export const REJECT_PAYMENT = gql`
  mutation RejectPayment($paymentId: ID!, $adminNotes: String!) {
    rejectPayment(paymentId: $paymentId, adminNotes: $adminNotes) {
      id
      status
      adminNotes
    }
  }
`;

export const APPROVE_PAYMENT = gql`
  mutation ApprovePayment($paymentId: ID!, $adminNotes: String) {
    approvePayment(paymentId: $paymentId, adminNotes: $adminNotes) {
      id
      status
      adminNotes
    }
  }
`;

export const SUBMIT_PAYMENT_PROOF = gql`
  mutation SubmitPaymentProof($paymentId: ID!, $proofUrl: String!) {
    submitPaymentProof(paymentId: $paymentId, proofUrl: $proofUrl) {
      id
      status
      proofOfPaymentUrl
    }
  }
`;

export const BECOME_TRAINER = gql`
  mutation BecomeTrainer(
    $avatar: String,
    $coverImage: String,
    $specialties: [String],
    $experienceYears: Int,
    $teachingPhilosophy: String,
    $qualifications: [String],
    $rateHourly: Int,
    $linkedinProfile: String,
    $githubProfile: String,
    $websiteUrl: String
  ) {
    becomeTrainer(
      avatar: $avatar,
      coverImage: $coverImage,
      specialties: $specialties,
      experienceYears: $experienceYears,
      teachingPhilosophy: $teachingPhilosophy,
      qualifications: $qualifications,
      rateHourly: $rateHourly,
      linkedinProfile: $linkedinProfile,
      githubProfile: $githubProfile,
      websiteUrl: $websiteUrl
    ) {
      id
      role
      isTrainerApproved
      trainerApplication {
        specialties
        experienceYears
        teachingPhilosophy
        status
      }
    }
  }
`;

export const APPROVE_TRAINER = gql`
  mutation ApproveTrainer($userId: ID!, $approved: Boolean!, $reviewNote: String) {
    approveTrainer(userId: $userId, approved: $approved, reviewNote: $reviewNote) {
      id
      role
      isTrainerApproved
      trainerApplication {
        status
        reviewNote
      }
    }
  }
`;

export const MARK_TOUR_COMPLETED = gql`
  mutation MarkTourCompleted {
    markTourCompleted {
      id
      isFirst
    }
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) {
      id
      read
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

// ========== DISBURSEMENT MUTATIONS ==========
export const UPDATE_PLATFORM_COMMISSION_CONFIG = gql`
  mutation UpdatePlatformCommissionConfig($type: String!, $value: Float!) {
    updatePlatformCommissionConfig(type: $type, value: $value) {
      type
      value
      autoDisbursement
    }
  }
`;

export const TOGGLE_AUTO_DISBURSEMENT = gql`
  mutation ToggleAutoDisbursement($enabled: Boolean!) {
    toggleAutoDisbursement(enabled: $enabled) {
      type
      value
      autoDisbursement
    }
  }
`;

export const SET_DISBURSEMENT_PRIMARY_PROVIDER = gql`
  mutation SetDisbursementPrimaryProvider($provider: String!) {
    setDisbursementPrimaryProvider(provider: $provider) {
      type
      value
      autoDisbursement
      disbursementPrimaryProvider
    }
  }
`;

export const FORCE_APPROVE_DISBURSEMENT = gql`
  mutation ForceApproveDisbursement($id: ID!) {
    forceApproveDisbursement(id: $id) {
      id
      status
      releaseDate
      approvedBy
      approvedAt
      intouchReferenceId
      failureReason
      statusHistory {
        status
        timestamp
        note
      }
    }
  }
`;

export const SET_HOLD_DAYS_CONFIG = gql`
  mutation SetHoldDaysConfig($days: Int!) {
    setHoldDaysConfig(days: $days)
  }
`;

export const RETRY_DISBURSEMENT = gql`
  mutation RetryDisbursement($id: ID!) {
    retryDisbursement(id: $id) {
      id
      status
      retryCount
      intouchTransactionRef
      intouchReferenceId
      failureReason
      statusHistory {
        status
        timestamp
        note
      }
    }
  }
`;

export const VOID_DISBURSEMENT = gql`
  mutation VoidDisbursement($id: ID!, $reason: String) {
    voidDisbursement(id: $id, reason: $reason) {
      id
      status
      failureReason
      statusHistory {
        status
        timestamp
        note
      }
    }
  }
`;

export const APPROVE_DISBURSEMENT = gql`
  mutation ApproveDisbursement($id: ID!) {
    approveDisbursement(id: $id) {
      id
      status
      releaseDate
      approvedBy
      approvedAt
      intouchReferenceId
      failureReason
      statusHistory {
        status
        timestamp
        note
      }
    }
  }
`;

export const MANUAL_DISBURSE = gql`
  mutation ManualDisburse($paymentId: ID!, $amount: Float!, $phoneNumber: String!, $reason: String) {
    manualDisburse(paymentId: $paymentId, amount: $amount, phoneNumber: $phoneNumber, reason: $reason) {
      id
      status
      netAmount
      intouchReferenceId
    }
  }
`;

// ========== REFUND MUTATIONS ==========
export const REQUEST_REFUND = gql`
  mutation RequestRefund($paymentId: ID!, $reason: String!) {
    requestRefund(paymentId: $paymentId, reason: $reason) {
      id
      status
      amount
      reason
    }
  }
`;

export const VERIFY_REFUND_REQUEST = gql`
  mutation VerifyRefundRequest($id: ID!, $note: String) {
    verifyRefundRequest(id: $id, note: $note) {
      id
      status
      adminNote
      verifiedAt
    }
  }
`;

export const APPROVE_REFUND = gql`
  mutation ApproveRefund($id: ID!, $note: String) {
    approveRefund(id: $id, note: $note) {
      id
      status
      approvedAt
      refundedAmount
    }
  }
`;

export const FORCE_APPROVE_REFUND = gql`
  mutation ForceApproveRefund($id: ID!, $note: String) {
    forceApproveRefund(id: $id, note: $note) {
      id
      status
      approvedAt
      refundedAmount
      forceApproved
    }
  }
`;

export const REJECT_REFUND = gql`
  mutation RejectRefund($id: ID!, $reason: String!) {
    rejectRefund(id: $id, reason: $reason) {
      id
      status
      adminNote
    }
  }
`;

export const SEND_DIRECT_MONEY = gql`
  mutation SendDirectMoney($amount: Float!, $phoneNumber: String!, $reason: String) {
    sendDirectMoney(amount: $amount, phoneNumber: $phoneNumber, reason: $reason) {
      success
      message
      transactionId
      referenceId
      amount
      phoneNumber
    }
  }
`;

export const REQUEST_INTOUCH_PAYMENT = gql`
  mutation RequestIntouchPayment($amount: Float!, $phoneNumber: String!, $reason: String) {
    requestIntouchPayment(amount: $amount, phoneNumber: $phoneNumber, reason: $reason) {
      success
      message
      transactionId
      referenceId
      amount
      phoneNumber
    }
  }
`;

export const UPDATE_PRESENCE = gql`
  mutation UpdatePresence {
    updatePresence
  }
`;

export const GO_OFFLINE = gql`
  mutation GoOffline {
    goOffline
  }
`;

export const UPDATE_USER_LOCATION = gql`
  mutation UpdateUserLocation($latitude: Float!, $longitude: Float!) {
    updateUserLocation(latitude: $latitude, longitude: $longitude) {
      id
      latitude
      longitude
      locationUpdatedAt
      locationShared
    }
  }
`;

export const ADMIN_UPDATE_USER_LOCATION = gql`
  mutation AdminUpdateUserLocation($userId: ID!, $latitude: Float!, $longitude: Float!) {
    adminUpdateUserLocation(userId: $userId, latitude: $latitude, longitude: $longitude) {
      id
      latitude
      longitude
      locationUpdatedAt
      locationShared
    }
  }
`;

export const SET_USER_LOCATION_DENIED = gql`
  mutation SetUserLocationDenied($userId: ID!, $denied: Boolean!) {
    setUserLocationDenied(userId: $userId, denied: $denied) {
      latitude
      longitude
      locationUpdatedAt
      locationShared
      locationDenied
    }
  }
`;

export const SET_USER_LOCATION_FORCE_ALLOWED = gql`
  mutation SetUserLocationForceAllowed($userId: ID!, $forceAllowed: Boolean!) {
    setUserLocationForceAllowed(userId: $userId, forceAllowed: $forceAllowed) {
      latitude
      longitude
      locationUpdatedAt
      locationShared
      locationDenied
    }
  }
`;

export const BATCH_FORCE_ALLOW_LOCATIONS = gql`
  mutation BatchForceAllowLocations($userIds: [ID!]!) {
    batchForceAllowLocations(userIds: $userIds)
  }
`;

export const ASSIGN_PROJECT_TO_USERS = gql`
  mutation AssignProjectToUsers($projectId: ID!, $userIds: [ID!]!, $type: String!, $deadline: String) {
    assignProjectToUsers(projectId: $projectId, userIds: $userIds, type: $type, deadline: $deadline) {
      id
      title
      status
    }
  }
`;

// ========== EVENT APPLICATION MUTATIONS ==========
export const APPLY_TO_EVENT = gql`
  mutation ApplyToEvent($eventId: ID!, $applicationAnswers: [ApplicationAnswerInput], $selectedDeliveryMode: String) {
    applyToEvent(eventId: $eventId, applicationAnswers: $applicationAnswers, selectedDeliveryMode: $selectedDeliveryMode) {
      id
      status
    }
  }
`;

export const REVIEW_EVENT_APPLICATION = gql`
  mutation ReviewEventApplication($id: ID!, $status: String!, $rejectionReason: String) {
    reviewEventApplication(id: $id, status: $status, rejectionReason: $rejectionReason) {
      id
      status
    }
  }
`;

export const ENROLL_EVENT_APPLICANT = gql`
  mutation EnrollEventApplicant($applicationId: ID!) {
    enrollEventApplicant(applicationId: $applicationId) {
      id
      username
      email
    }
  }
`;

export const REQUEST_PROJECT_START = gql`
  mutation RequestProjectStart($templateId: ID!, $type: String!, $teamMembers: [ID]) {
    requestProjectStart(templateId: $templateId, type: $type, teamMembers: $teamMembers) {
      id
      title
      status
      type
    }
  }
`;

export const APPROVE_PROJECT_REQUEST = gql`
  mutation ApproveProjectRequest($projectId: ID!, $approved: Boolean!, $feedback: String) {
    approveProjectRequest(projectId: $projectId, approved: $approved, feedback: $feedback) {
      id
      status
      feedback
    }
  }
`;

export const TOGGLE_PROJECT_TEMPLATE = gql`
  mutation ToggleProjectTemplate($id: ID!, $visibility: String) {
    toggleProjectTemplate(id: $id, visibility: $visibility) {
      id
      isTemplate
      visibility
    }
  }
`;
export const APPROVE_LESSON_PROGRESS = gql`
  mutation ApproveLessonProgress($userId: ID!, $courseId: ID!, $lessonId: String!) {
    approveLessonProgress(userId: $userId, courseId: $courseId, lessonId: $lessonId)
  }
`;

// ===== SPRINT & TASK BOARD MUTATIONS =====

export const CREATE_INTERNSHIP_SPRINT = gql`
  mutation CreateInternshipSprint($projectId: ID!, $teamId: ID!, $title: String!, $goal: String, $startDate: String!, $endDate: String!) {
    createInternshipSprint(projectId: $projectId, teamId: $teamId, title: $title, goal: $goal, startDate: $startDate, endDate: $endDate) {
      id title goal startDate endDate status order
    }
  }
`;

export const UPDATE_INTERNSHIP_SPRINT = gql`
  mutation UpdateInternshipSprint($id: ID!, $title: String, $goal: String, $startDate: String, $endDate: String, $status: String) {
    updateInternshipSprint(id: $id, title: $title, goal: $goal, startDate: $startDate, endDate: $endDate, status: $status) {
      id title goal startDate endDate status order
    }
  }
`;

export const DELETE_INTERNSHIP_SPRINT = gql`
  mutation DeleteInternshipSprint($id: ID!) {
    deleteInternshipSprint(id: $id)
  }
`;

export const CREATE_INTERNSHIP_TASK = gql`
  mutation CreateInternshipTask($sprintId: ID, $projectId: ID!, $teamId: ID!, $title: String!, $description: String, $assigneeId: ID, $priority: String, $storyPoints: Int, $labels: [String]) {
    createInternshipTask(sprintId: $sprintId, projectId: $projectId, teamId: $teamId, title: $title, description: $description, assigneeId: $assigneeId, priority: $priority, storyPoints: $storyPoints, labels: $labels) {
      id title description status priority storyPoints labels sprintId assigneeId createdAt
      assignee { id username fullName avatar }
    }
  }
`;

export const UPDATE_INTERNSHIP_TASK = gql`
  mutation UpdateInternshipTask($id: ID!, $title: String, $description: String, $status: String, $priority: String, $assigneeId: ID, $sprintId: ID, $storyPoints: Int, $labels: [String], $taskType: String, $dueDate: String) {
    updateInternshipTask(id: $id, title: $title, description: $description, status: $status, priority: $priority, assigneeId: $assigneeId, sprintId: $sprintId, storyPoints: $storyPoints, labels: $labels, taskType: $taskType, dueDate: $dueDate) {
      id
      title
      description
      status
      priority
      taskType
      dueDate
      assignee {
        id
        username
        fullName
        avatar
      }
      labels
      storyPoints
      sprintId
    }
  }
`;

export const ADD_INTERNSHIP_COMMENT = gql`
  mutation AddInternshipComment($taskId: ID!, $content: String!, $attachments: [TaskAttachmentInput]) {
    addInternshipComment(taskId: $taskId, content: $content, attachments: $attachments) {
      id
      content
      createdAt
      author {
        id
        username
        avatar
      }
    }
  }
`;

export const MOVE_INTERNSHIP_TASK_STATUS = gql`
  mutation MoveInternshipTaskStatus($id: ID!, $status: String!) {
    moveInternshipTaskStatus(id: $id, status: $status) {
      id status approvedBy approvedAt rejectionReason updatedAt
    }
  }
`;

export const APPROVE_INTERNSHIP_TASK = gql`
  mutation ApproveInternshipTask($id: ID!) {
    approveInternshipTask(id: $id) {
      id status approvedBy approvedAt updatedAt
    }
  }
`;

export const REJECT_INTERNSHIP_TASK = gql`
  mutation RejectInternshipTask($id: ID!, $reason: String) {
    rejectInternshipTask(id: $id, reason: $reason) {
      id status rejectionReason updatedAt
    }
  }
`;

export const ADD_TASK_ATTACHMENT = gql`
  mutation AddTaskAttachment($taskId: ID!, $name: String!, $url: String!, $type: String) {
    addTaskAttachment(taskId: $taskId, name: $name, url: $url, type: $type) {
      id attachments { name url type }
    }
  }
`;

export const REMOVE_TASK_ATTACHMENT = gql`
  mutation RemoveTaskAttachment($taskId: ID!, $attachmentIndex: Int!) {
    removeTaskAttachment(taskId: $taskId, attachmentIndex: $attachmentIndex) {
      id attachments { name url type }
    }
  }
`;

export const DELETE_INTERNSHIP_TASK = gql`
  mutation DeleteInternshipTask($id: ID!) {
    deleteInternshipTask(id: $id)
  }
`;

export const UPDATE_INTERNSHIP_PROJECT_DOCUMENT = gql`
  mutation UpdateInternshipProjectDocument($projectId: ID!, $document: String!) {
    updateInternshipProjectDocument(projectId: $projectId, document: $document) {
      id title document
    }
  }
`;

export const UPDATE_PROJECT_WORKFLOW = gql`
  mutation UpdateProjectWorkflow($projectId: ID!, $workflow: [WorkflowStageInput!]!) {
    updateProjectWorkflow(projectId: $projectId, workflow: $workflow) {
      id
      workflow {
        id
        label
        color
        order
        type
      }
    }
  }
`;

export const ASSIGN_PROJECT_TO_TEAM = gql`
  mutation AssignInternshipProjectToTeam($teamId: ID!, $projectId: ID!) {
    assignInternshipProjectToTeam(teamId: $teamId, projectId: $projectId) {
      id
      internshipProjectId
      internshipProject {
        id
        title
        description
        requiredSkills
        documentation {
          links {
            title
            url
          }
        }
      }
    }
  }
`;

export const CREATE_INTERNSHIP_MEETING = gql`
  mutation CreateInternshipMeeting($title: String!, $description: String, $startTime: String!, $endTime: String!, $meetLink: String, $type: String!, $contextType: String, $contextTitle: String, $courseIds: [ID!], $teamIds: [ID!], $clientIds: [ID!], $internshipProgramIds: [ID!], $eventIds: [ID!], $userIds: [ID!], $mentorIds: [ID!], $recurrenceDays: [Int], $recurrenceEndDate: String) {
    createInternshipMeeting(title: $title, description: $description, startTime: $startTime, endTime: $endTime, meetLink: $meetLink, type: $type, contextType: $contextType, contextTitle: $contextTitle, courseIds: $courseIds, teamIds: $teamIds, clientIds: $clientIds, internshipProgramIds: $internshipProgramIds, eventIds: $eventIds, userIds: $userIds, mentorIds: $mentorIds, recurrenceDays: $recurrenceDays, recurrenceEndDate: $recurrenceEndDate) {
      id
      title
      type
      contextType
      contextTitle
      recurrenceDays
      recurrenceEndDate
      startTime
      endTime
      meetLink
      teams {
        id
        name
      }
    }
  }
`;

export const UPDATE_INTERNSHIP_MEETING = gql`
  mutation UpdateInternshipMeeting($id: ID!, $title: String, $description: String, $startTime: String, $endTime: String, $meetLink: String, $type: String, $teamIds: [ID!], $recurrenceDays: [Int], $recurrenceEndDate: String, $changeReason: String) {
    updateInternshipMeeting(id: $id, title: $title, description: $description, startTime: $startTime, endTime: $endTime, meetLink: $meetLink, type: $type, teamIds: $teamIds, recurrenceDays: $recurrenceDays, recurrenceEndDate: $recurrenceEndDate, changeReason: $changeReason) {
      id
      title
      type
      recurrenceDays
      recurrenceEndDate
      startTime
      endTime
    }
  }
`;

export const DELETE_INTERNSHIP_MEETING = gql`
  mutation DeleteInternshipMeeting($id: ID!, $reason: String) {
    deleteInternshipMeeting(id: $id, reason: $reason)
  }
`;

export const CANCEL_INTERNSHIP_MEETING = gql`
  mutation CancelInternshipMeeting($id: ID!, $reason: String!) {
    cancelInternshipMeeting(id: $id, reason: $reason)
  }
`;

export const MARK_ATTENDANCE = gql`
  mutation MarkAttendance($meetingId: ID!, $userId: ID!, $attended: Boolean!) {
    markAttendance(meetingId: $meetingId, userId: $userId, attended: $attended) {
      id
      attendees {
        userId
        role
        attended
      }
    }
  }
`;

export const BATCH_MARK_ATTENDANCE = gql`
  mutation BatchMarkAttendance($meetingId: ID!, $attendanceData: [AttendanceDataInput!]!) {
    batchMarkAttendance(meetingId: $meetingId, attendanceData: $attendanceData) {
      id
      attendees {
        userId
        role
        attended
      }
    }
  }
`;

export const SETUP_2FA = gql`
  mutation Setup2FA {
    setup2FA {
      qrCodeDataUrl
      secret
    }
  }
`;

export const VERIFY_2FA = gql`
  mutation Verify2FA($code: String!) {
    verify2FA(code: $code) {
      token
      requires2FA
      user {
        id
        username
        email
        role
        fullName
        avatar
      }
    }
  }
`;

export const DISABLE_2FA = gql`
  mutation Disable2FA($code: String!) {
    disable2FA(code: $code)
  }
`;

export const REQUEST_EMAIL_OTP = gql`
  mutation RequestEmailOTP($email: String!) {
    requestEmailOTP(email: $email)
  }
`;

export const VERIFY_EMAIL_OTP = gql`
  mutation VerifyEmailOTP($email: String!, $code: String!) {
    verifyEmailOTP(email: $email, code: $code) {
      token
      user {
        id
        username
        email
        role
        fullName
      }
    }
  }
`;

export const ENABLE_EMAIL_2FA = gql`
  mutation EnableEmail2FA($code: String!) {
    enableEmail2FA(code: $code)
  }
`;

export const DISABLE_EMAIL_2FA = gql`
  mutation DisableEmail2FA($code: String!) {
    disableEmail2FA(code: $code)
  }
`;

export const UPDATE_QUIZ_CONFIG = gql`
  mutation UpdateQuizConfig($courseId: ID!, $lessonId: ID!, $quizConfig: QuizConfigInput!) {
    updateQuizConfig(courseId: $courseId, lessonId: $lessonId, quizConfig: $quizConfig) {
      id
    }
  }
`;

export const UPDATE_EXAM_CONFIG = gql`
  mutation UpdateExamConfig($courseId: ID!, $lessonId: String!, $config: AssignmentConfigInput!) {
    updateExamConfig(courseId: $courseId, lessonId: $lessonId, config: $config) {
      id
    }
  }
`;

export const AI_GRADE_OPEN_ANSWERS = gql`
  mutation AiGradeOpenAnswers($submissionId: ID!) {
    aiGradeOpenAnswers(submissionId: $submissionId) {
      id
      totalScore
      status
    }
  }
`;

export const CREATE_APPLICATION_PHASE = gql`
  mutation CreateApplicationPhase(
    $programId: ID!
    $name: String!
    $description: String
    $order: Int
    $enableApproval: Boolean
    $isInterviewPhase: Boolean
    $allowMeetingScheduling: Boolean
  ) {
    createApplicationPhase(
      programId: $programId
      name: $name
      description: $description
      order: $order
      enableApproval: $enableApproval
      isInterviewPhase: $isInterviewPhase
      allowMeetingScheduling: $allowMeetingScheduling
    ) {
      id
      name
      description
      order
      enableApproval
      isInterviewPhase
      allowMeetingScheduling
    }
  }
`;

// ─── CLIENT APPLICATION MUTATIONS ─────────────────────────────────────────────
export const APPLY_TO_BE_CLIENT = gql`
  mutation ApplyToBeClient($reason: String!) {
    applyToBeClient(reason: $reason) {
      id
      status
      reason
      createdAt
    }
  }
`;

export const APPROVE_CLIENT_APPLICATION = gql`
  mutation ApproveClientApplication($id: ID!, $assignedAdminId: ID) {
    approveClientApplication(id: $id, assignedAdminId: $assignedAdminId) {
      id
      status
      assignedAdminId
      assignedAdmin {
        id
        username
        fullName
      }
      user {
        id
        username
        email
        role
      }
    }
  }
`;

export const REJECT_CLIENT_APPLICATION = gql`
  mutation RejectClientApplication($id: ID!, $adminFeedback: String) {
    rejectClientApplication(id: $id, adminFeedback: $adminFeedback) {
      id
      status
      adminFeedback
    }
  }
`;

export const ASSIGN_ADMIN_TO_CLIENT = gql`
  mutation AssignAdminToClient($adminId: ID!) {
    assignAdminToClient(adminId: $adminId) {
      id
      assignedAdmin {
        id
        username
        fullName
        avatar
      }
    }
  }
`;

// ========== SCHOLARSHIP MUTATIONS ==========
export const GRANT_SCHOLARSHIP = gql`
  mutation GrantScholarship($userId: ID!, $type: String!, $itemId: ID!, $itemTitle: String!, $reason: String) {
    grantScholarship(userId: $userId, type: $type, itemId: $itemId, itemTitle: $itemTitle, reason: $reason) {
      id
      userId
      type
      itemId
      itemTitle
      status
      reason
      createdAt
    }
  }
`;

export const GRANT_BATCH_SCHOLARSHIPS = gql`
  mutation GrantBatchScholarships($userIds: [ID!]!, $type: String!, $itemIds: [ID!]!, $itemTitles: [String!], $reason: String, $grantedLatitude: Float, $grantedLongitude: Float, $grantedCity: String, $grantedCountry: String) {
    grantBatchScholarships(userIds: $userIds, type: $type, itemIds: $itemIds, itemTitles: $itemTitles, reason: $reason, grantedLatitude: $grantedLatitude, grantedLongitude: $grantedLongitude, grantedCity: $grantedCity, grantedCountry: $grantedCountry)
  }
`;

export const APPROVE_SCHOLARSHIP = gql`
  mutation ApproveScholarship($id: ID!) {
    approveScholarship(id: $id) {
      id
      status
      approvedAt
      approvedBy
      approvedByUser {
        id
        username
      }
    }
  }
`;

export const REVOKE_SCHOLARSHIP = gql`
  mutation RevokeScholarship($id: ID!, $reason: String!) {
    revokeScholarship(id: $id, reason: $reason) {
      id
      status
      revokedAt
      revokedReason
    }
  }
`;

// ========== DISCOUNT CODE MUTATIONS ==========
export const CREATE_DISCOUNT_CODE = gql`
  mutation CreateDiscountCode($code: String!, $courseId: ID, $discountType: String!, $discountValue: Float!, $maxUses: Int, $expiresAt: String, $description: String) {
    createDiscountCode(code: $code, courseId: $courseId, discountType: $discountType, discountValue: $discountValue, maxUses: $maxUses, expiresAt: $expiresAt, description: $description) {
      id
      code
      courseId
      discountType
      discountValue
      maxUses
      currentUses
      isActive
      expiresAt
      description
      createdAt
    }
  }
`;

export const UPDATE_DISCOUNT_CODE = gql`
  mutation UpdateDiscountCode($id: ID!, $code: String, $discountType: String, $discountValue: Float, $maxUses: Int, $isActive: Boolean, $expiresAt: String, $description: String) {
    updateDiscountCode(id: $id, code: $code, discountType: $discountType, discountValue: $discountValue, maxUses: $maxUses, isActive: $isActive, expiresAt: $expiresAt, description: $description) {
      id
      code
      courseId
      discountType
      discountValue
      maxUses
      currentUses
      isActive
      expiresAt
      description
      createdAt
    }
  }
`;

export const DELETE_DISCOUNT_CODE = gql`
  mutation DeleteDiscountCode($id: ID!) {
    deleteDiscountCode(id: $id)
  }
`;

export const VALIDATE_DISCOUNT_CODE = gql`
  mutation ValidateDiscountCode($code: String!, $courseId: ID) {
    validateDiscountCode(code: $code, courseId: $courseId) {
      valid
      discountType
      discountValue
      finalPrice
      originalPrice
      message
    }
  }
`;

// ========== EVENT MUTATIONS ==========
export const CREATE_EVENT = gql`
  mutation CreateEvent(
    $title: String!
    $description: String!
    $shortDescription: String
    $type: String!
    $startDate: String!
    $endDate: String!
    $timezone: String
    $location: String
    $isOnline: Boolean
    $meetingLink: String
    $image: String
    $price: Float
    $currency: String
    $maxAttendees: Int
    $organizerName: String
    $organizerBio: String
    $organizerPhoto: String
    $tags: [String!]
    $status: String
    $featured: Boolean
  ) {
    createEvent(
      title: $title
      description: $description
      shortDescription: $shortDescription
      type: $type
      startDate: $startDate
      endDate: $endDate
      timezone: $timezone
      location: $location
      isOnline: $isOnline
      meetingLink: $meetingLink
      image: $image
      price: $price
      currency: $currency
      maxAttendees: $maxAttendees
      organizerName: $organizerName
      organizerBio: $organizerBio
      organizerPhoto: $organizerPhoto
      tags: $tags
      status: $status
      featured: $featured
    ) {
      id
      title
      type
      startDate
      endDate
      status
      image
      featured
    }
  }
`

export const UPDATE_EVENT = gql`
  mutation UpdateEvent(
    $id: ID!
    $title: String
    $description: String
    $shortDescription: String
    $type: String
    $startDate: String
    $endDate: String
    $timezone: String
    $location: String
    $isOnline: Boolean
    $meetingLink: String
    $image: String
    $price: Float
    $currency: String
    $maxAttendees: Int
    $organizerName: String
    $organizerBio: String
    $organizerPhoto: String
    $tags: [String!]
    $status: String
    $featured: Boolean
  ) {
    updateEvent(
      id: $id
      title: $title
      description: $description
      shortDescription: $shortDescription
      type: $type
      startDate: $startDate
      endDate: $endDate
      timezone: $timezone
      location: $location
      isOnline: $isOnline
      meetingLink: $meetingLink
      image: $image
      price: $price
      currency: $currency
      maxAttendees: $maxAttendees
      organizerName: $organizerName
      organizerBio: $organizerBio
      organizerPhoto: $organizerPhoto
      tags: $tags
      status: $status
      featured: $featured
    ) {
      id
      title
      type
      status
    }
  }
`

export const DELETE_EVENT = gql`
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id)
  }
`
export const SUBMIT_TESTIMONIAL = gql`
  mutation SubmitTestimonial($quote: String!, $authorRole: String, $authorCompany: String, $rating: Int) {
    submitTestimonial(quote: $quote, authorRole: $authorRole, authorCompany: $authorCompany, rating: $rating) {
      id
      quote
      authorName
      authorRole
      authorCompany
      rating
      status
    }
  }
`;

export const ADMIN_SUBMIT_TESTIMONIAL = gql`
  mutation AdminSubmitTestimonial($userId: ID!, $quote: String!, $authorRole: String, $authorCompany: String, $rating: Int) {
    adminSubmitTestimonial(userId: $userId, quote: $quote, authorRole: $authorRole, authorCompany: $authorCompany, rating: $rating) {
      id
      quote
      authorName
      status
    }
  }
`;

export const REVIEW_TESTIMONIAL = gql`
  mutation ReviewTestimonial($id: ID!, $status: String!, $note: String) {
    reviewTestimonial(id: $id, status: $status, note: $note) {
      id
      status
      reviewNote
    }
  }
`;

export const DELETE_TESTIMONIAL = gql`
  mutation DeleteTestimonial($id: ID!) {
    deleteTestimonial(id: $id)
  }
`;
