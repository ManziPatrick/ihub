export const typeDefs = `#graphql
  scalar Upload
  scalar JSON

  type AuthPayload {
    token: String
    user: User
    requires2FA: Boolean
    requires2FASetup: Boolean
  }

  type CompletedLesson {
    courseId: ID!
    lessonId: String!
  }

  type LessonProgress {
    lessonId: String!
    completed: Boolean!
    timeSpent: Int!
    lastAccessed: String
    visits: Int
  }

  type CourseProgress {
    id: ID!
    userId: ID!
    courseId: ID!
    lessons: [LessonProgress]
    totalTimeSpent: Int
    maxStudents: Int
    status: String
    allowedDeliveryModes: [String!]
    enrollmentMode: String
    githubClassroom: String
    overallProgress: Int
    lastAccessed: String
  }

  type Activity {
    action: String!
    details: String
    timestamp: String!
  }

  type UserBadge {
    badge: Badge
    awardedAt: String
  }

  type Grade {
    courseId: ID!
    lessonId: String
    lesson: Lesson
    score: Int
    feedback: String
    gradedBy: User
    gradedAt: String
  }

  type Badge {
    id: ID!
    title: String!
    description: String!
    icon: String
    category: String
    createdBy: User
  }

  type ThemePreference {
    primaryColor: String
    mode: String
    lightBg: String
    darkBg: String
  }

  type CourseProgressSnapshot {
    courseId: ID!
    lessonId: String!
    updatedAt: String
  }

  type User {
    id: ID!
    username: String!
    email: String!
    role: String!
    enrolledCourses: [Course]
    completedLessons: [CompletedLesson]
    courseProgress: [CourseProgressSnapshot]
    completedCourses: [Course]
    activityLog: [Activity]
    badges: [UserBadge]
    grades: [Grade]
    level: Int
    academicStatus: String
    permissions: [String]
    streak: Int
    xp: Int
    themePreference: ThemePreference
    fullName: String
    bio: String
    avatar: String
    phone: String
    location: String
    latitude: Float
    longitude: Float
    locationUpdatedAt: String
    locationShared: Boolean
    locationDenied: Boolean
    title: String
    studentProfile: StudentProfile
    notes: String
    meetingLink: String
    deliveryMode: String
    isDeleted: Boolean
    lastActive: String
    isOnline: Boolean
    totalTimeSpent: Int
    lastPath: String
    twoFactorEnabled: Boolean
    createdAt: String
    updatedAt: String
    bookings: [Booking]
    certificateName: String
    school: String
    isExternal: Boolean
    isFirst: Boolean
    certificates: [Certificate]
    createdBy: User
  }

  type PaginationInfo {
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
    pageSize: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  type UserResponse {
    items: [User]
    pagination: PaginationInfo
  }

  type CourseResponse {
    items: [Course]
    pagination: PaginationInfo
  }

  type PaymentResponse {
    items: [PaymentTransaction]
    pagination: PaginationInfo
  }

  type ProjectResponse {
    items: [Project]
    pagination: PaginationInfo
  }

  type InternshipResponse {
    items: [Internship]
    pagination: PaginationInfo
  }

  type InternshipProgramResponse {
    items: [InternshipProgram]
    pagination: PaginationInfo
  }

  type InternshipApplicationResponse {
    items: [InternshipApplication]
    pagination: PaginationInfo
  }

  type InternshipActivityLogResponse {
    items: [InternshipActivityLog]
    pagination: PaginationInfo
  }

  type InternshipTeamResponse {
    items: [InternshipTeam]
    pagination: PaginationInfo
  }

  type InternshipProjectResponse {
    items: [InternshipProject]
    pagination: PaginationInfo
  }

  type AssignmentSubmissionResponse {
    items: [AssignmentSubmission]
    pagination: PaginationInfo
  }

  type BookingResponse {
    items: [Booking]
    pagination: PaginationInfo
  }

  type BadgeResponse {
    items: [Badge]
    pagination: PaginationInfo
  }

  type CompletedUser {
    id: ID!
    user: User
    completedCourseIds: [ID]
    completedCourses: [Course]
    hasCertificate: Boolean!
    certificate: Certificate
    completedLessonsCount: Int!
    overallProgress: Int
    completedAt: String
    status: String
    examScore: Int
  }

  type CompletedUserResponse {
    items: [CompletedUser]
    pagination: PaginationInfo
  }


  type Message {
    id: ID!
    content: String!
    sender: User!
    createdAt: String!
    conversationId: ID!
  }

  type Conversation {
    id: ID!
    participants: [User!]!
    lastMessage: Message
    updatedAt: String!
  }

  type Config {
    id: ID!
    key: String!
    value: String!
    description: String
  }

  type Resource {
    id: ID!
    title: String!
    type: String!
    source: String!
    url: String!
    linkedTo: ID
    onModel: String
    visibility: String
    createdBy: User
    createdAt: String
  }

  type CodeExercise {
    id: ID
    title: String!
    description: String
    language: String!
    initialCode: String!
    solutionCode: String
    testCode: String
    type: String!
    setupCode: String
    expectedOutput: String
  }

  type CodeExecResult {
    output: String!
    passed: Boolean!
    testResults: [TestResult!]
    error: String
  }

  type TestResult {
    name: String!
    passed: Boolean!
    expected: String!
    actual: String!
    error: String
  }

  type Lesson {
    id: ID!
    title: String!
    content: String
    videoUrl: String
    fileUrl: String
    duration: Int
    type: String
    resources: [Resource]
    isAssignment: Boolean
    requiredAssignment: Boolean
    assignmentDescription: String
    assignmentDeliverables: [String]
    assignmentQuestions: [AssignmentQuestion]
    assignmentConfig: AssignmentConfig
    quizQuestions: [QuizQuestion]
    quizConfig: QuizConfig
    codeExercises: [CodeExercise]
    order: Int
  }

  type QuizQuestion {
    id: ID
    questionText: String!
    type: String!
    imageUrl: String
    options: [String]
    correctOptionIndex: Int
    matchingPairs: [MatchingPair]
    explanation: String
  }

  type MatchingPair {
    id: String
    left: String
    right: String
  }

  type AssignmentQuestion {
    id: ID
    questionText: String!
    type: String!
    options: [String]
    correctOptionIndex: Int
    correctOptionIndexes: [Int]
    matchingPairs: [MatchingPair]
    explanation: String
    points: Int
  }

  type AssignmentConfig {
    timeLimit: Int
    allowRetakes: Boolean
    disableRightClick: Boolean
    mode: String
  }

  type QuizConfig {
    disableRightClick: Boolean
    timeLimit: Int
    quizType: String
    questionsPerPage: Int
  }

  type UserGradeReport {
    id: ID!
    userId: ID!
    username: String!
    email: String!
    courseTitle: String!
    lessonTitle: String!
    score: Int!
    gradedAt: String!
    status: String!
  }

  type AssignmentAnswer {
    questionId: String
    answerText: String
    score: Int
    aiFeedback: String
  }

  type CourseApplication {
    id: ID!
    courseId: ID!
    course: Course
    userId: ID!
    user: User
    status: String!
    applicationAnswers: [ApplicationAnswer]!
    selectedDeliveryMode: String
    rejectionReason: String
    createdAt: String!
    updatedAt: String!
  }

  type CourseApplicationResponse {
    items: [CourseApplication]
    pagination: PaginationInfo
  }

  type Module {
    id: ID!
    title: String!
    description: String
    lessons: [Lesson!]!
    order: Int
  }

  type ProgramStage {
    id: Int!
    title: String!
    duration: String!
    purpose: String!
    keyActivities: [String!]!
    outcome: String!
  }

  type Course {
    id: ID!
    title: String!
    description: String!
    descriptionSnippet: String
    thumbnail: String
    instructor: User
    price: Float
    discountPrice: Float
    level: String
    category: String
    status: String
    allowedDeliveryModes: [String!]
    enrollmentMode: String
    applicationQuestions: [ApplicationQuestion]
    modules: [Module!]!
    modulesCount: Int!
    totalLessonsCount: Int!
    studentsEnrolled: [User]!
    studentsEnrolledCount: Int!
    submissionRequired: Boolean
    signerName: String
    signerSignature: String
    school: String
    isFeatured: Boolean
    createdAt: String!
    updatedAt: String!
  }



  input ResourceInput {
    title: String!
    type: String!
    source: String!
    url: String!
    linkedTo: ID
    onModel: String
    visibility: String
  }

  type Stats {
    totalUsers: Int!
    totalCourses: Int!
    totalStudents: Int!
    totalRevenue: Float!
  }

  type ActivityLogEntry {
    username: String!
    action: String!
    details: String
    timestamp: String!
  }

  type Question {
    id: ID!
    courseId: ID!
    lessonId: ID
    moduleNumber: String
    lessonNumber: String
    questionText: String!
    imageUrl: String
    options: [String!]!
    correctOptionIndex: Int!
    explanation: String
    createdAt: String!
  }

  type PaymentLineItem {
    id: ID!
    title: String!
    price: Float
  }

  type PaymentTransaction {
    id: ID!
    studentName: String!
    type: String! # 'Course Enrollment', 'Internship Fee', or 'Bulk Enrollment'
    itemTitle: String!
    amount: Float!
    currency: String!
    date: String!
    status: String!
    method: String
    selectedDeliveryMode: String
    proofOfPaymentUrl: String
    adminNotes: String
    courseIds: [ID]
    internshipIds: [ID]
    courses: [PaymentLineItem]
    internships: [PaymentLineItem]
    createdBy: User
  }

  type Booking {
    id: ID!
    userId: ID!
    user: User
    mentorId: ID
    mentor: User
    type: String!
    date: String!
    time: String!
    topic: String
    notes: String
    status: String
    meetingLink: String
    deliveryMode: String
    createdAt: String
  }

  type TeamMember {
    userId: ID
    user: User
    name: String!
    role: String!
  }

  type Task {
    id: String
    title: String!
    completed: Boolean!
    approved: Boolean
    feedback: String
    category: String
  }


  type ProjectLink {
    title: String!
    url: String!
  }

  type Documentation {
    images: [String]
    videos: [String]
    ppts: [String]
    links: [ProjectLink]
    inPersonNotes: String
  }

  type MilestoneSubmission {
    url: String
    submittedAt: String
    message: String
    feedback: String
    status: String
    aiReview: String
    # Additional fields used by some clients
    version: String
    fileName: String
    submittedBy: ID
  }


  type MilestoneDetailed {
    title: String!
    description: String
    dueDate: String
    completed: Boolean
    deliverables: [String]
    submissions: [MilestoneSubmission]
    feedback: String
    aiAnalysis: String
  }

  type ProjectStage {
    name: String!
    description: String
    order: Int!
    status: String!
    assignee: User
    assigneeId: ID
    dueDate: String
    completed: Boolean!
    completedAt: String
  }

  type Evaluation {
    rating: Int
    comment: String
    summary: String

    clientFeedback: ClientFeedback
    developerEvaluations: [DeveloperEvaluation!]
    reviewerNotes: String
  }

  type ClientFeedback {
    rating: Int
    comment: String
    submittedAt: String
  }

  type DeveloperEvaluation {
    developerId: ID
    developer: User
    rating: Int
    comment: String
    notes: String
    reviewerNotes: String
  }
  type Project {

    id: ID!
    userId: ID!
    user: User
    title: String!
    course: String!
    type: String!
    status: String!
    isTemplate: Boolean
    visibility: String
    category: String
    progress: Int!
    deadline: String
    submittedAt: String
    grade: String
    feedback: String
    # Field used by some clients
    evaluation: Evaluation

    team: [TeamMember]

    tasks: [Task]
    milestones: [MilestoneDetailed]
    stages: [ProjectStage]
    documentation: Documentation
    description: String!
    submissionUrl: String
    mentors: [User]
    conversationId: ID
    conversation: Conversation
    milestoneVideos: [MilestoneVideo]
    milestonePPTs: [MilestonePPT]
    createdAt: String!
    updatedAt: String!
  }


  type MilestonePPT {
    title: String!
    pptUrl: String!
    milestoneIndex: Int!
  }

  type MilestoneVideo {
    title: String!
    videoUrl: String!
    milestoneIndex: Int!
  }

  type Requirement {
    title: String!
    completed: Boolean!
    current: Int
    total: Int
  }

  type Certificate {
    id: ID!
    userId: ID!
    user: User
    courseId: ID!
    course: Course
    courseTitle: String!
    issueDate: String
    credentialId: String
    recipientName: String
    status: String!
    grade: Int
    progress: Int
    requirements: [Requirement]
    signerName: String
    signerSignature: String
    createdAt: String!
    updatedAt: String!
  }

  type Payment {
    amount: Float!
    currency: String!
    status: String!
    paidAt: String
    discount: Int
    isPaidProgram: Boolean
    installmentsAllowed: Boolean
    deliveryMode: String
    createdBy: User
  }

  type ApplicationDetails {
    background: String
    currentLevel: String
    goal: String
    locationPreference: String
  }

  type Milestone {
    title: String!
    completed: Boolean!
    date: String!
  }

  type Meeting {
    title: String!
    time: String!
    type: String!
    url: String
    deliveryMode: String
    attendees: [String]
  }

  type SprintReview {
    week: Int
    grade: Int
    feedback: String
    reviewedBy: User
    date: String
  }

  type Standup {
    id: ID!
    internshipId: ID!
    userId: ID!
    user: User
    date: String!
    yesterday: String!
    today: String!
    blockers: String
    workLink: String
    attendanceStatus: String!
    trainerFeedback: String
    createdAt: String!
  }

  type Internship {
    id: ID!
    userId: ID!
    user: User
    title: String!
    organization: String!
    company: String
    cohort: String
    groupId: String
    startDate: String
    endDate: String
    duration: String!
    type: String!
    status: String!
    stage: String
    currentStage: Int
    completedStages: [String]
    projects: [Project]
    mentorId: ID
    mentor: User
    mentors: [User]
    assignedProject: InternshipProject
    academicSchool: String
    academicLevel: String
    previousLanguages: String
    skills: String
    phoneNumber: String
    portfolioUrl: String
    payment: Payment!
    applicationDetails: ApplicationDetails
    progress: Int!
    milestones: [Milestone]
    tasks: [InternshipTask]
    meetings: [Meeting]
    sprintReviews: [SprintReview]
    signerName: String
    signerSignature: String
    createdAt: String!
    updatedAt: String!
  }

  type AnalyticsData {
    userGrowth: [ChartPoint]
    revenueGrowth: [ChartPoint]
    courseDistribution: [DistributionPoint]
    roleDistribution: [DistributionPoint]
    internshipStats: InternshipAnalytics
    projectStats: ProjectAnalytics
  }

  type ChartPoint {
    label: String!
    value: Float!
  }

  type DistributionPoint {
    name: String!
    value: Int!
  }

  type InternshipAnalytics {
    total: Int!
    eligible: Int!
    enrolled: Int!
    graduated: Int!
  }

  type ProjectAnalytics {
    total: Int!
    completed: Int!
    pendingReview: Int!
    inProgress: Int!
  }

  type TrainerStats {
    activeCourses: Int!
    totalStudents: Int!
    pendingReviews: Int!
    mentees: Int!
  }

  type RecentEnrollment {
    studentName: String!
    courseTitle: String!
    enrolledAt: String!
    amount: Float
  }

  type CoursePerformance {
    courseTitle: String!
    studentCount: Int!
    avgCompletion: Int!
    revenue: Float!
  }

  type AdminDashboardData {
    stats: Stats!
    recentEnrollments: [RecentEnrollment!]
    coursePerformance: [CoursePerformance!]
  }

  type AssignmentSubmission {
    id: ID!
    userId: ID
    user: User
    courseId: ID
    course: Course
    lessonId: String!
    lesson: Lesson
    content: String # URL or Text (can be null for exams)
    status: String! # 'pending', 'reviewed', 'revision_requested', 'approved', 'failed'
    grade: Int
    feedback: String
    answers: [AssignmentAnswer]
    totalScore: Int
    timeTaken: Int
    createdAt: String!
    updatedAt: String!
  }

  type UploadSignature {
    signature: String!
    timestamp: Int!
    folder: String!
    cloudName: String!
    apiKey: String!
  }

  type FileResponse {
    url: String!
    publicId: String
    resourceType: String
  }

  type IpGeolocationResult {
    latitude: Float
    longitude: Float
    city: String
    country: String
  }

  type LocationForceResult {
    latitude: Float
    longitude: Float
    locationUpdatedAt: String
    locationShared: Boolean
    locationDenied: Boolean
  }

  type Query {
    getMyIpGeolocation: IpGeolocationResult!

    # Resources
    getResources(linkedTo: ID, onModel: String): [Resource!]!
    getResource(id: ID!): Resource!
    hello: String
    users(page: Int, limit: Int, createdBy: ID, role: String): UserResponse
    conversations: [Conversation]
    messages(conversationId: ID!): [Message]
    courses(page: Int, limit: Int, sortBy: String, featured: Boolean, search: String, category: String, price: String, level: String, school: String, location: String): CourseResponse
    course(id: ID!, lite: Boolean): Course
    lessonContent(courseId: ID!, lessonId: ID!): Lesson
    stats: Stats
    me: User
    categories: [String]
    schools: [String]
    trainerStudents: [User]
    recentActivity(createdBy: ID): [ActivityLogEntry]
    questions(courseId: ID!, lessonId: ID, moduleNumber: String, lessonNumber: String): [Question]
    bookings(page: Int, limit: Int): BookingResponse
    payments(page: Int, limit: Int, createdBy: ID): PaymentResponse
    analytics(createdBy: ID): AnalyticsData
    branding: BrandingConfig
    configs: [Config]
    myPayments: [PaymentTransaction]
    myCourseProgress(courseId: ID!): CourseProgress
    badges(page: Int, limit: Int, createdBy: ID): BadgeResponse
    chatBotGreeting: ChatResponse
    
    trainerStats: TrainerStats
    adminDashboardData(createdBy: ID): AdminDashboardData
    allUserGradeReports: [UserGradeReport]

    # Projects
    projects(page: Int, limit: Int, course: String): ProjectResponse
    projectTemplates(category: String, course: String): [Project]
    myProjects(status: String): [Project]
    myInternships(status: String): [Internship]
    myBookings(status: String): [Booking]
    getAllStudents: [User]
    getAllTrainers: [User]
    getTopStudents(courseId: ID, limit: Int): [User]
    getAnalyticsExport: String
    project(id: ID!): Project
    
    # Certificates
    certificates: [Certificate]
    myCertificates: [Certificate]
    certificate(id: ID!): Certificate
    getUserCertificates(userId: ID!): [Certificate]
    

    # Meetings
    getInternshipMeetings(teamId: ID, programId: ID, status: String, contextType: String): [InternshipMeeting]
    getMyInternshipMeetings: [InternshipMeeting]
    getMeetingAttendance(meetingId: ID!): [MeetingAttendee]
    
    # Internships
    internships(page: Int, limit: Int): InternshipResponse
    getInternshipStandups(internshipId: ID!): [Standup]
    getMyStandups: [Standup]
    myInternship: Internship
    myMentees: [Internship]
    internship(id: ID!): Internship
    allInternshipStages: [ProgramStage]
    
    dailyDashboard: DailyDashboard
    notifications: [Notification]
    getCourseQuestions(courseId: ID!): [Question!]!
    getUploadSignature(folder: String, resourceType: String): UploadSignature!
    
    # Assignments
    getAssignmentSubmissions(courseId: ID, lessonId: String, page: Int, limit: Int): AssignmentSubmissionResponse
    
    # Completed Users
    completedUsers(page: Int, limit: Int, createdBy: ID, courseId: ID, dateFrom: String, dateTo: String): CompletedUserResponse
    
    # Course Applications
    courseApplications(courseId: ID, status: String, page: Int, limit: Int): CourseApplicationResponse
    myCourseApplications: [CourseApplication]
  }

  type DailyDashboard {
    tasks: [DashboardTask]
    meetings: [Meeting]
    unreadMessages: Int
    aiSuggestion: String
    motivationalQuote: String
    resources: [Resource!]
  }

  type DashboardTask {
    id: ID!
    title: String!
    deadline: String
    priority: String
    type: String # 'Project Milestone' or 'Internship Task'
    sourceId: ID # Project ID or Internship ID
    status: String
  }



  input CodeExerciseInput {
    id: ID
    title: String!
    description: String
    language: String!
    initialCode: String!
    solutionCode: String
    testCode: String
    type: String!
    setupCode: String
    expectedOutput: String
  }

  input LessonInput {
    id: ID
    title: String!
    content: String
    videoUrl: String
    fileUrl: String
    duration: Int
    type: String
    resources: [ResourceInput]
    isAssignment: Boolean
    requiredAssignment: Boolean
    assignmentDescription: String
    assignmentDeliverables: [String]
    assignmentQuestions: [AssignmentQuestionInput]
    assignmentConfig: AssignmentConfigInput
    quizQuestions: [QuizQuestionInput]
    quizConfig: QuizConfigInput
    codeExercises: [CodeExerciseInput]
    order: Int
  }

  input QuizQuestionInput {
    id: ID
    questionText: String!
    type: String!
    imageUrl: String
    options: [String]
    correctOptionIndex: Int
    matchingPairs: [MatchingPairInput]
    explanation: String
  }

  input MatchingPairInput {
    id: String
    left: String
    right: String
  }

  input QuizConfigInput {
    disableRightClick: Boolean
    timeLimit: Int
    quizType: String
    questionsPerPage: Int
  }

  input AssignmentQuestionInput {
    id: ID
    questionText: String!
    type: String!
    options: [String]
    correctOptionIndex: Int
    correctOptionIndexes: [Int]
    explanation: String
    points: Int
  }

  input AssignmentConfigInput {
    timeLimit: Int
    allowRetakes: Boolean
    disableRightClick: Boolean
    mode: String
  }

  input AssignmentAnswerInput {
    questionId: String!
    answerText: String!
  }

  input QuestionScoreInput {
    questionId: String!
    score: Int!
  }

  input ModuleInput {
    id: ID
    title: String!
    description: String
    lessons: [LessonInput!]!
  }

  input TeamMemberInput {
    userId: ID
    name: String!
    role: String!
  }

  input TaskInput {
    id: String
    title: String!
    completed: Boolean
    approved: Boolean
    feedback: String
  }

  input ProjectLinkInput {
    title: String!
    url: String!
  }

  input DocumentationInput {
    images: [String]
    videos: [String]
    ppts: [String]
    links: [ProjectLinkInput]
    inPersonNotes: String
  }

  input RequirementInput {
    title: String!
    completed: Boolean
    current: Int
    total: Int
  }

  input MilestoneInput {
    title: String!
    completed: Boolean
    date: String!
  }

  input InternshipTaskInput {
    title: String!
    status: String
    priority: String
  }

  input MeetingInput {
    title: String!
    time: String!
    type: String!
  }

  input PaymentInput {
    amount: Float!
    currency: String
    status: String
    paidAt: String
    discount: Int
  }

  type BrandingConfig {
    primaryColor: String
    secondaryColor: String
    accentColor: String
    logoUrl: String
    siteName: String
    portalTitle: String
    maintenanceMode: Boolean
  }

  type ChatResponse {
    content: String!
    role: String!
    action: String
    actionData: String
  }

  type TwoFactorSetupResponse {
    qrCodeDataUrl: String!
    secret: String!
  }

  type Mutation {
    # Resources
    createResource(input: ResourceInput!): Resource!
    updateResource(id: ID!, input: ResourceInput!): Resource!
    deleteResource(id: ID!): Boolean!
    updateBranding(
      primaryColor: String
      secondaryColor: String
      accentColor: String
      logoUrl: String
      siteName: String
      portalTitle: String
      maintenanceMode: Boolean
    ): BrandingConfig

    chatWithAI(message: String!): ChatResponse
    explainTask(taskTitle: String!, description: String!): ChatResponse
    reviewSubmission(taskTitle: String!, submissionContent: String!): ChatResponse
    generateAIQuiz(courseId: ID, lessonId: ID, courseTitle: String, lessonTitle: String, lessonContent: String, questionCount: Int, prompt: String): [Question]
    hintForQuestion(questionText: String!, options: [String!]!): String
    generateQuestionExplanation(questionText: String!, options: [String!]!, correctOptionIndex: Int!): String

    # Code Execution
    runCode(code: String!, language: String!, testCode: String, exerciseType: String, setupCode: String): CodeExecResult!

    # Uploads
    getUploadSignature(folder: String, resourceType: String): UploadSignature!
    singleUpload(file: Upload!, folder: String, resourceType: String): FileResponse!

    sendMessage(receiverId: ID!, content: String!): Message
    register(username: String!, email: String!, password: String!, fullName: String, role: String): AuthPayload
    login(email: String!, password: String!): AuthPayload
    googleLogin(token: String!): AuthPayload
    requestPasswordReset(email: String!): Boolean
    resetPassword(token: String!, newPassword: String!): Boolean
    
    # Questions
    createQuestion(courseId: ID!, lessonId: ID, moduleNumber: String, lessonNumber: String, questionText: String!, imageUrl: String, options: [String!]!, correctOptionIndex: Int!, explanation: String): Question
    updateQuestion(id: ID!, moduleNumber: String, lessonNumber: String, questionText: String, imageUrl: String, options: [String!], correctOptionIndex: Int, explanation: String): Question

    deleteQuestion(id: ID!): Boolean

    # Badges
    awardBadge(userId: ID!, badgeId: ID!): User
    


    # Badges

    
    # Project Templates
    enrollInProject(templateId: ID!, type: String!, teamMembers: [ID]): Project @deprecated(reason: "Use requestProjectStart instead")
    requestProjectStart(templateId: ID!, type: String!, teamMembers: [ID]): Project
    approveProjectRequest(projectId: ID!, approved: Boolean!, feedback: String): Project
    toggleProjectTemplate(id: ID!, visibility: String): Project
    assignProjectToUsers(projectId: ID!, userIds: [ID!]!, type: String!, deadline: String): [Project]

    enroll(courseId: ID!, selectedDeliveryMode: String): Course
    createCourse(
      title: String!
      description: String!
      thumbnail: String
      price: Float
      discountPrice: Float
      level: String
      category: String
      instructorId: ID
      status: String
      enrollmentMode: String
      submissionRequired: Boolean
      signerName: String
      signerSignature: String
      school: String
      applicationQuestions: [ApplicationQuestionInput]
      modules: [ModuleInput!]!
    ): Course
    updateCourse(
      id: ID!
      title: String
      description: String
      thumbnail: String
      price: Float
      discountPrice: Float
      level: String
      category: String
      instructorId: ID
      status: String
      enrollmentMode: String
      submissionRequired: Boolean
      signerName: String
      signerSignature: String
      school: String
      isFeatured: Boolean
      applicationQuestions: [ApplicationQuestionInput]
      modules: [ModuleInput!]
    ): Course
    deleteCourse(id: ID!): Boolean
    createUser(username: String!, email: String!, password: String!, role: String, permissions: [String], fullName: String, bio: String, avatar: String, phone: String, location: String, title: String, school: String): User
    updateUser(id: ID!, username: String, email: String, password: String, role: String, permissions: [String], fullName: String, bio: String, avatar: String, phone: String, location: String, title: String, school: String, isFirst: Boolean, certificateName: String): User
        updateUserLocation(latitude: Float!, longitude: Float!): User
    adminUpdateUserLocation(userId: ID!, latitude: Float!, longitude: Float!): User
    setUserLocationDenied(userId: ID!, denied: Boolean!): LocationForceResult!
    setUserLocationForceAllowed(userId: ID!, forceAllowed: Boolean!): LocationForceResult!
    batchForceAllowLocations(userIds: [ID!]!): Int!
    deleteUser(id: ID!): Boolean
    
    # Progress Tracking
    updateLessonProgress(courseId: ID!, lessonId: String!, timeSpent: Int!, completed: Boolean): Boolean
    updateCourseProgress(courseId: ID!, lessonId: String!): User
    
    completeLesson(courseId: ID!, lessonId: String!): User
    rewardStudent(xp: Int!, streak: Int, courseId: ID, lessonId: ID, score: Int): User!
    trackActivity(action: String!, details: String): User

    
    createBooking(
      mentorId: ID,
      type: String!,
      date: String!,
      time: String!,
      topic: String,
      notes: String,
      meetingLink: String
    ): Booking
    updateBookingStatus(id: ID!, status: String!, meetingLink: String): Booking
    markNotificationRead(id: ID!): Notification
    markAllNotificationsRead: Boolean
    updatePresence: Boolean
    goOffline: Boolean
    createBadge(title: String!, description: String!, icon: String, category: String): Badge

    awardBadgeToBatch(userIds: [ID!]!, badgeId: ID!): Boolean
    submitGrade(userId: ID!, courseId: ID!, lessonId: String, score: Int!, feedback: String): User


    # Payment Verification
    submitPaymentProof(paymentId: ID!, proofUrl: String!): PaymentTransaction
    approvePayment(paymentId: ID!, adminNotes: String): PaymentTransaction
    rejectPayment(paymentId: ID!, adminNotes: String!): PaymentTransaction

    promoteStudent(userId: ID!, academicStatus: String!, level: Int): User
    
    updateBadge(id: ID!, title: String, description: String, icon: String, category: String): Badge
    deleteBadge(id: ID!): Boolean
    updateConfig(key: String!, value: String!, description: String): Config

    # Projects
    createProject(
      userId: ID
      title: String!
      course: String!
      type: String!
      description: String!
      deadline: String
      team: [TeamMemberInput]
      tasks: [TaskInput]
      documentation: DocumentationInput
      mentorIds: [ID]
    ): Project
    sendMessageToProject(projectId: ID!, content: String!): Message
    updateProject(
      id: ID!
      title: String
      course: String
      type: String
      status: String
      progress: Int
      deadline: String
      submittedAt: String
      grade: String
      feedback: String
      team: [TeamMemberInput]
      tasks: [TaskInput]
      documentation: DocumentationInput
      description: String
      submissionUrl: String
      mentorIds: [ID]
    ): Project
    deleteProject(id: ID!): Boolean
    submitProject(id: ID!, submissionUrl: String!): Project
    # Auto-assign students to teams of 3
    autoGroupStudents(courseId: ID!, projectTitle: String!, description: String!, deadline: String): [Project]

    # Certificates
    createCertificate(
      userId: ID!
      courseId: ID!
      courseTitle: String!
      requirements: [RequirementInput]
    ): Certificate
    updateCertificate(
      id: ID!
      status: String
      progress: Int
      issueDate: String
      credentialId: String
      requirements: [RequirementInput]
    ): Certificate
    issueCertificate(id: ID!, credentialId: String!): Certificate
    updateCertificateRecipientName(id: ID!, recipientName: String!): Certificate
    deleteCertificate(id: ID!): Boolean

    # Internships
    createInternship(
      userId: ID!
      title: String!
      organization: String
      company: String
      cohort: String
      duration: String!
      type: String!
      payment: PaymentInput!
      startDate: String
      endDate: String
      mentorId: ID
      stage: String
      projects: [ID]
      milestones: [MilestoneInput]
      tasks: [InternshipTaskInput]
      meetings: [MeetingInput]
      academicSchool: String
      academicLevel: String
      previousLanguages: String
      skills: String
      phoneNumber: String
      portfolioUrl: String
      mentorIds: [ID]
      signerName: String
      signerSignature: String
    ): Internship
    updateInternship(
      id: ID!
      title: String
      organization: String
      company: String
      cohort: String
      startDate: String
      endDate: String
      duration: String
      type: String
      status: String
      stage: String
      projects: [ID]
      mentorId: ID
      payment: PaymentInput
      progress: Int
      milestones: [MilestoneInput]
      tasks: [InternshipTaskInput]
      meetings: [MeetingInput]
      academicSchool: String
      academicLevel: String
      previousLanguages: String
      skills: String
      phoneNumber: String
      portfolioUrl: String
      mentorIds: [ID]
      signerName: String
      signerSignature: String
    ): Internship
    deleteInternship(id: ID!): Boolean
    applyForInternship(internshipId: ID!): Internship
    promoteIntern(internshipIds: [ID!], targetStage: Int!): Boolean
    updateInternshipStage(id: ID!, stage: String!, currentStage: Int!): Internship
    updateInternshipPayment(id: ID!, status: String!, paidAt: String): Internship
    payForCourse(courseId: ID!, amount: Float!, paymentMethod: String!): PaymentTransaction
    enrollStudentInCourse(courseId: ID!, userId: ID!): Course
    addInternshipTask(internshipId: ID!, title: String!, priority: String): Internship
    addBatchTask(internshipIds: [ID!], stage: Int, cohort: String, title: String!, priority: String): Boolean
    
    submitStandup(internshipId: ID!, yesterday: String!, today: String!, blockers: String, workLink: String): Standup
    gradeSprintMilestone(internshipId: ID!, week: Int!, grade: Int!, feedback: String!): Internship
    scheduleMeeting(internshipId: ID!, title: String!, time: String!, type: String!, url: String, attendees: [String]): Internship

    updateTheme(primaryColor: String, mode: String, lightBg: String, darkBg: String): User
    updateInternshipTaskLegacy(internshipId: ID!, taskId: ID!, status: String!): Internship
    updateTaskProgress(projectId: ID!, taskId: String!, completed: Boolean!): Project
    gradeProject(id: ID!, grade: String!, feedback: String!): Project
    assignGroupProject(internshipIds: [ID!], title: String!, description: String!, repoUrl: String, deadline: String, mentorIds: [ID!]): Project


    # New Internship Module Mutations
    createInternshipProgram(title: String!, description: String!, duration: String!, startDate: String!, endDate: String!, applicationDeadline: String!, eligibility: String, rules: String, price: Float, discount: Float, currency: String, image: String, maxSpots: Int, applicationQuestions: [ApplicationQuestionInput], signerName: String, signerSignature: String): InternshipProgram
    updateInternshipProgram(id: ID!, title: String, description: String, duration: String, startDate: String, endDate: String, applicationDeadline: String, status: String, eligibility: String, rules: String, price: Float, discount: Float, currency: String, image: String, maxSpots: Int, applicationQuestions: [ApplicationQuestionInput], signerName: String, signerSignature: String): InternshipProgram
    deleteInternshipProgram(id: ID!): Boolean

    applyToInternshipProgram(internshipProgramId: ID!, skills: [String]!, portfolioUrl: String, resumeUrl: String, availability: String!, applicationAnswers: [ApplicationAnswerInput]): InternshipApplication
    reviewInternshipApplication(id: ID!, status: String!, rejectionReason: String): InternshipApplication

    createInternshipProject(internshipProgramId: ID!, title: String!, description: String!, document: String, requiredSkills: [String], minTeamSize: Int, maxTeamSize: Int, defaultTickets: [DefaultTicketInput], documentation: DocumentationInput): InternshipProject
    updateInternshipProject(id: ID!, title: String, description: String, document: String, requiredSkills: [String], minTeamSize: Int, maxTeamSize: Int, status: String, defaultTickets: [DefaultTicketInput], documentation: DocumentationInput): InternshipProject
    deleteInternshipProject(id: ID!): Boolean

    # Team & Milestone Mutations
    createInternshipTeam(name: String!, internshipProjectId: ID!, internshipProgramId: ID!, mentorId: ID, type: String): InternshipTeam
    updateInternshipTeam(id: ID!, name: String, internshipProjectId: ID, internshipProgramId: ID, mentorId: ID, status: String, type: String): InternshipTeam
    deleteInternshipTeam(id: ID!): Boolean
    addInternToTeam(teamId: ID!, userId: ID!, role: String): InternshipTeamMember
    removeInternFromTeam(teamMemberId: ID!): Boolean

    createInternshipMilestone(internshipProjectId: ID!, title: String!, description: String, deadline: String!, order: Int): InternshipMilestone
    submitInternshipWork(milestoneId: ID!, teamId: ID!, contentUrl: String!, description: String): InternshipSubmission
    reviewInternshipSubmission(id: ID!, status: String!, feedback: String): InternshipSubmission

    logInternshipTime(teamId: ID!, description: String!, minutes: Int!, date: String): InternshipTimeLog
    submitMentorFeedback(userId: ID!, teamId: ID, score: Int!, comments: String!): InternshipMentorFeedback
    
    # Course Applications
    applyToCourse(courseId: ID!, applicationAnswers: [ApplicationAnswerInput], selectedDeliveryMode: String): CourseApplication
    updateCourseApplicationStatus(applicationId: ID!, status: String!, rejectionReason: String): CourseApplication
  }

  # New Internship Module Types
  type ApplicationQuestion {
    label: String!
    type: String!
    required: Boolean!
    options: [String]
    maxFileSize: Int
    acceptedFileTypes: [String]
  }

  input ApplicationQuestionInput {
    label: String!
    type: String!
    required: Boolean!
    options: [String]
    maxFileSize: Int
    acceptedFileTypes: [String]
  }

  type ApplicationAnswer {
    questionLabel: String
    answer: String
  }

  input ApplicationAnswerInput {
    questionLabel: String!
    answer: String!
  }
  type InternshipProgramStats {
    totalApplications: Int!
    approvedApplications: Int!
    rejectedApplications: Int!
    pendingApplications: Int!
    enrolledStudents: Int!
    totalRevenue: Float!
  }

  type InternshipProgram {
    id: ID!
    title: String!
    description: String!
    duration: String!
    startDate: String!
    endDate: String!
    applicationDeadline: String!
    eligibility: String
    rules: String
    price: Float
    discount: Float
    currency: String
    image: String
    maxSpots: Int
    applicationQuestions: [ApplicationQuestion]
    status: String!
    allowedDeliveryModes: [String!]
    isDeleted: Boolean
    signerName: String
    signerSignature: String
    createdAt: String
    updatedAt: String
    stats: InternshipProgramStats
  }

  type InternshipApplication {
    id: ID!
    internshipProgramId: ID!
    internshipProgram: InternshipProgram
    userId: ID!
    user: User
    status: String!
    skills: [String]
    portfolioUrl: String
    resumeUrl: String
    availability: String
    selectedDeliveryMode: String
    applicationAnswers: [ApplicationAnswer!]
    rejectionReason: String
    payment: InternshipPayment
    createdAt: String
  }

  type DefaultTicket {
    title: String!
    description: String
    priority: String
    taskType: String
    labels: [String]
    suggestedRole: String
    order: Int
  }

  input DefaultTicketInput {
    title: String!
    description: String
    priority: String
    taskType: String
    labels: [String]
    suggestedRole: String
    order: Int
  }

  type InternshipProject {
    id: ID!
    internshipProgramId: ID!
    internshipProgram: InternshipProgram
    title: String!
    description: String!
    document: String
    objectives: [String]
    requiredSkills: [String]
    teamSizeRange: TeamSizeRange
    milestones: [InternshipMilestone]
    documentation: Documentation
    defaultTickets: [DefaultTicket]
    workflow: [WorkflowStage]
    status: String!
    createdAt: String
  }

  type WorkflowStage {
    id: String!
    label: String!
    color: String!
    order: Int!
    type: String!
  }

  type TeamSizeRange {
    min: Int
    max: Int
  }

  type InternshipTeam {
    id: ID!
    name: String!
    internshipProjectId: ID!
    internshipProject: InternshipProject
    internshipProgramId: ID!
    internshipProgram: InternshipProgram
    mentorId: ID
    mentor: User
    members: [InternshipTeamMember]
    status: String!
    type: String!
    createdAt: String
  }

  type InternshipTeamMember {
    id: ID!
    teamId: ID!
    userId: ID!
    user: User
    role: String!
    joinedAt: String
  }

  type InternshipMilestone {
    id: ID!
    internshipProjectId: ID!
    title: String!
    description: String
    deadline: String!
    order: Int
    completed: Boolean
    completedAt: String
    createdAt: String
  }

  type InternshipSubmission {
    id: ID!
    milestoneId: ID!
    milestone: InternshipMilestone
    teamId: ID!
    team: InternshipTeam
    userId: ID!
    user: User
    contentUrl: String!
    description: String
    status: String!
    feedback: String
    createdAt: String
  }

  type InternshipTimeLog {
    id: ID!
    userId: ID!
    user: User
    teamId: ID!
    description: String!
    minutes: Int!
    date: String!
    createdAt: String
  }

  type InternshipMentorFeedback {
    id: ID!
    mentorId: ID!
    mentor: User
    userId: ID!
    user: User
    teamId: ID
    score: Int!
    comments: String!
    createdAt: String
  }

  type InternshipActivityLog {
    id: ID!
    userId: ID!
    user: User
    action: String!
    module: String!
    targetType: String!
    targetId: ID
    details: String
    createdAt: String
  }

  extend type Query {
    internshipPrograms(page: Int, limit: Int, search: String, category: String, price: String, level: String, school: String): InternshipProgramResponse
    internshipProgram(id: ID!): InternshipProgram
    internshipApplications(programId: ID, status: String, page: Int, limit: Int): InternshipApplicationResponse
    myInternshipApplications: [InternshipApplication]
    internshipProject(id: ID!): InternshipProject
    internshipProjects(programId: ID, page: Int, limit: Int): InternshipProjectResponse
    internshipTeams(programId: ID, page: Int, limit: Int): InternshipTeamResponse
    myInternshipTeam: InternshipTeam
    internshipSubmissions(teamId: ID): [InternshipSubmission]
    internshipTimeLogs(teamId: ID, userId: ID): [InternshipTimeLog]
    internshipActivityLogs(programId: ID, targetType: String, targetId: ID, page: Int, limit: Int): InternshipActivityLogResponse
    
    # Sprint & Task Board Queries
    internshipSprints(projectId: ID!, teamId: ID): [InternshipSprint]
    internshipTasks(projectId: ID, sprintId: ID, teamId: ID, assigneeId: ID): [InternshipTask]
    internshipTask(id: ID!): InternshipTask
    
    # Student Progress Queries
    studentProjectProgress: [StudentProjectSummary!]!

  # Student Profile Queries
    myStudentProfile: StudentProfile
    studentProfile(userId: ID!): StudentProfile
    studentProfiles: [StudentProfile]
    
    # Payment & Invoice Queries
    internshipPayments(programId: ID, status: String): [InternshipPayment]
    myInternshipPayments: [InternshipPayment]
    internshipPayment(id: ID!): InternshipPayment
    internshipInvoices(userId: ID): [InternshipInvoice]
    internshipInvoice(id: ID!): InternshipInvoice
    
    # Certificate Queries
    internshipCertificates(programId: ID): [InternshipCertificate]
    myInternshipCertificates: [InternshipCertificate]
    internshipCertificate(id: ID!): InternshipCertificate
    verifyCertificate(certificateNumber: String!): InternshipCertificate

    # Notifications
    unreadNotificationCount: Int!
  }

  # Student Profile Type
  type StudentProfile {
    id: ID!
    userId: ID!
    user: User
    school: String
    educationLevel: String
    academicYear: String
    fieldOfStudy: String
    city: String
    sector: String
    cell: String
    village: String
    skills: [String!]
    availability: String
    bio: String
    linkedinUrl: String
    githubUrl: String
    portfolioUrl: String
    completionPercentage: Int!
    isComplete: Boolean!
    createdAt: String
    updatedAt: String
  }

  # Sprint & Task Types
  type InternshipSprint {
    id: ID!
    projectId: ID!
    project: InternshipProject
    teamId: ID!
    team: InternshipTeam
    title: String!
    goal: String
    startDate: String!
    endDate: String!
    status: String!
    order: Int
    taskCount: Int
    completedTaskCount: Int
    createdAt: String
  }

  type TaskAttachment {
    name: String
    url: String
    type: String
    fileName: String
    fileUrl: String
  }

  input TaskAttachmentInput {
    name: String
    url: String
    type: String
    fileName: String
    fileUrl: String
  }

  type InternshipTask {
    id: ID!
    sprintId: ID
    sprint: InternshipSprint
    projectId: ID
    project: InternshipProject
    teamId: ID
    team: InternshipTeam
    title: String!
    description: String
    status: String!
    priority: String!
    assigneeId: ID
    assignee: User
    storyPoints: Int
    labels: [String]
    attachments: [TaskAttachment]
    taskType: String
    dependencies: [ID]
    dueDate: String
    comments: [InternshipComment]
    order: Int
    approvedBy: ID
    approvedByUser: User
    approvedAt: String
    rejectionReason: String
    createdAt: String
    updatedAt: String
  }

  type InternshipComment {
    id: ID!
    taskId: ID!
    authorId: ID!
    author: User
    content: String!
    attachments: [TaskAttachment]
    createdAt: String
    updatedAt: String
  }

  # Payment Types
  type InternshipPayment {
    id: ID!
    userId: ID!
    user: User
    internshipProgramId: ID!
    internshipProgram: InternshipProgram
    amount: Float!
    currency: String!
    status: String!
    paymentMethod: String
    transactionId: String
    paidAt: String
    invoiceId: ID
    waivedBy: ID
    waivedByUser: User
    waivedReason: String
    notes: String
    paymentProofUrl: String
    createdAt: String
    updatedAt: String
  }

  type InternshipInvoice {
    id: ID!
    paymentId: ID!
    payment: InternshipPayment
    invoiceNumber: String!
    userId: ID!
    user: User
    internshipProgramId: ID!
    internshipProgram: InternshipProgram
    amount: Float!
    currency: String!
    issuedAt: String!
    dueDate: String!
    pdfUrl: String
    status: String!
    items: [InvoiceItem]
    notes: String
    createdAt: String
  }

  type InvoiceItem {
    description: String!
    quantity: Int!
    unitPrice: Float!
    total: Float!
  }

  # Certificate Types
  type InternshipCertificate {
    id: ID!
    userId: ID!
    user: User
    internshipProgramId: ID!
    internshipProgram: InternshipProgram
    teamId: ID!
    team: InternshipTeam
    certificateNumber: String!
    issuedAt: String!
    trainerId: ID!
    trainer: User
    trainerName: String!
    trainerSignature: String
    internTitle: String!
    programTitle: String!
    duration: String!
    startDate: String!
    endDate: String!
    completionDate: String!
    pdfUrl: String
    verificationUrl: String
    isRevoked: Boolean!
    revokedAt: String
    revokedBy: ID
    revokedByUser: User
    revocationReason: String
    createdAt: String
  }

  # Meeting Types
  enum MeetingFrequency {
    ONCE
    DAILY
    WEEKLY
    MONTHLY
    WORKSHOP
  }

  type InternshipMeeting {
    id: ID!
    title: String!
    description: String
    type: MeetingFrequency!
    deliveryMode: String!
    meetLink: String
    location: String
    startTime: String!
    endTime: String!
    recurrenceDays: [Int]
    recurrenceEndDate: String
    contextType: String
    contextTitle: String
    courseIds: [ID!]
    teamIds: [ID!]!
    clientIds: [ID!]
    internshipProgramIds: [ID!]
    userIds: [ID!]
    mentorIds: [ID!]
    teams: [InternshipTeam]
    hostId: ID!
    host: User
    attendees: [MeetingAttendee]
    status: String
    createdAt: String
    updatedAt: String
  }

  type CertificateMetadata {
    milestonesCompleted: Int
    totalMilestones: Int
    finalGrade: String
    skills: [String]
  }

  # Profile Validation Response
  type ProfileValidationResult {
    isValid: Boolean!
    missingFields: [String]
    completionPercentage: Int!
    message: String
  }

  # Certificate Eligibility Response
  type CertificateEligibility {
    isEligible: Boolean!
    milestonesCompleted: Boolean!
    trainerApproved: Boolean!
    paymentConfirmed: Boolean!
    message: String
  }

  extend type Mutation {
    # Student Profile Mutations
    createStudentProfile(
      school: String!
      educationLevel: String!
      academicYear: String
      fieldOfStudy: String
      city: String
      sector: String
      cell: String
      village: String
      skills: [String!]!
      availability: String!
      bio: String
      linkedinUrl: String
      githubUrl: String
      portfolioUrl: String
    ): StudentProfile

    updateStudentProfile(
      school: String
      educationLevel: String
      academicYear: String
      fieldOfStudy: String
      city: String
      sector: String
      cell: String
      village: String
      skills: [String]
      availability: String
      bio: String
      linkedinUrl: String
      githubUrl: String
      portfolioUrl: String
    ): StudentProfile

    validateProfileForInternship: ProfileValidationResult

    # Payment Mutations
    createInternshipPayment(
      internshipProgramId: ID!
      amount: Float!
      currency: String
    ): InternshipPayment

    processInternshipPayment(paymentId: ID!, transactionId: String, paymentMethod: String!, paymentProofUrl: String): InternshipPayment!

    waiveInternshipPayment(
      paymentId: ID!
      reason: String!
    ): InternshipPayment

    refundInternshipPayment(
      paymentId: ID!
      reason: String!
    ): InternshipPayment

    # Invoice Mutations
    generateInternshipInvoice(paymentId: ID!): InternshipInvoice
    
    # Certificate Mutations
    checkCertificateEligibility(teamId: ID!): CertificateEligibility

    generateInternshipCertificate(
      userId: ID!
      teamId: ID!
      trainerId: ID!
    ): InternshipCertificate

    revokeCertificate(
      certificateId: ID!
      reason: String!
    ): InternshipCertificate

    # Enhanced Application (with profile validation)
    applyToInternshipWithValidation(
      internshipProgramId: ID!
      skills: [String!]!
      availability: String!
      portfolioUrl: String
    ): InternshipApplication

    # Milestone Approval
    approveMilestone(
      milestoneId: ID!
      teamId: ID!
    ): InternshipMilestone

    approveInternForCertificate(
      userId: ID!
      teamId: ID!
      finalGrade: String!
    ): InternshipMentorFeedback

    # Stripe Payment
    createStripePaymentIntent(programId: ID!): StripePaymentIntent
    subscribeToNewsletter(email: String!): Boolean

    # Sprint Mutations
    createInternshipSprint(projectId: ID!, teamId: ID!, title: String!, goal: String, startDate: String!, endDate: String!): InternshipSprint
    updateInternshipSprint(id: ID!, title: String, goal: String, startDate: String, endDate: String, status: String): InternshipSprint
    deleteInternshipSprint(id: ID!): Boolean

    # Task Mutations
    createInternshipTask(sprintId: ID, projectId: ID!, teamId: ID!, title: String!, description: String, assigneeId: ID, priority: String, storyPoints: Int, labels: [String]): InternshipTask
    updateInternshipTask(id: ID!, title: String, description: String, status: String, priority: String, assigneeId: ID, sprintId: ID, storyPoints: Int, labels: [String], taskType: String, dueDate: String): InternshipTask
    addInternshipComment(taskId: ID!, content: String!, attachments: [TaskAttachmentInput]): InternshipComment
    deleteInternshipComment(id: ID!): Boolean
    moveInternshipTaskStatus(id: ID!, status: String!): InternshipTask
    approveInternshipTask(id: ID!): InternshipTask
    rejectInternshipTask(id: ID!, reason: String): InternshipTask
    addTaskAttachment(taskId: ID!, name: String!, url: String!, type: String): InternshipTask
    removeTaskAttachment(taskId: ID!, attachmentIndex: Int!): InternshipTask
    deleteInternshipTask(id: ID!): Boolean
    updateInternshipProjectDocument(projectId: ID!, document: String!): InternshipProject
    updateProjectWorkflow(projectId: ID!, workflow: [WorkflowStageInput!]!): InternshipProject
    assignInternshipProjectToTeam(teamId: ID!, projectId: ID!): InternshipTeam

    # Assignments
    submitAssignment(courseId: ID!, lessonId: String!, content: String!): AssignmentSubmission
    submitAssignmentExam(courseId: ID!, lessonId: String!, answers: [AssignmentAnswerInput!]!, timeTaken: Int): AssignmentSubmission
    gradeAssignment(submissionId: ID!, grade: Int!, feedback: String, questionScores: [QuestionScoreInput]): AssignmentSubmission
    updateExamConfig(courseId: ID!, lessonId: String!, config: AssignmentConfigInput!): Course
    updateQuizConfig(courseId: ID!, lessonId: ID!, quizConfig: QuizConfigInput!): Course
    aiGradeOpenAnswers(submissionId: ID!): AssignmentSubmission

    approveLessonProgress(
      userId: ID!
      courseId: ID!
      lessonId: String!
    ): Boolean

    pingInstructor(submissionId: ID!, message: String): Boolean

    # Meeting Mutations
    createInternshipMeeting(
      title: String!
      description: String
      type: String!
      startTime: String!
      endTime: String!
      contextType: String
      contextTitle: String
      courseIds: [ID!]
      teamIds: [ID!]
      clientIds: [ID!]
      internshipProgramIds: [ID!]
      userIds: [ID!]
      mentorIds: [ID!]
      meetLink: String
      recurrenceDays: [Int]
      recurrenceEndDate: String
    ): InternshipMeeting
    
    updateInternshipMeeting(
      id: ID!
      title: String
      description: String
      type: String
      startTime: String
      endTime: String
      contextType: String
      contextTitle: String
      courseIds: [ID!]
      teamIds: [ID!]
      clientIds: [ID!]
      internshipProgramIds: [ID!]
      userIds: [ID!]
      mentorIds: [ID!]
      meetLink: String
      recurrenceDays: [Int]
      recurrenceEndDate: String
    ): InternshipMeeting
    
    deleteInternshipMeeting(id: ID!): Boolean
    
    markAttendance(
      meetingId: ID!
      userId: ID!
      attended: Boolean!
    ): InternshipMeeting
    
    batchMarkAttendance(
      meetingId: ID!
      attendanceData: [AttendanceDataInput!]!
    ): InternshipMeeting
    
    sendTestEmail(to: String!): Boolean

    # Two-Factor Authentication
    setup2FA: TwoFactorSetupResponse!
    verify2FA(code: String!): AuthPayload!
    disable2FA(code: String!): Boolean!

    # Email OTP
    requestEmailOTP(email: String!): Boolean!
    verifyEmailOTP(email: String!, code: String!): AuthPayload!
    enableEmail2FA(code: String!): Boolean!
    disableEmail2FA(code: String!): Boolean!
  }

  # ─── Backup / Restore Types ────────────────────────────────────────────────
  type BackupRecord {
    id: ID!
    backupDbName: String!
    size: Float!
    actualSize: Float
    collections: [String!]!
    status: String!
    errorMessage: String
    triggeredBy: User
    metadata: JSON
    completedAt: String
    createdAt: String!
  }

  type RestoreResult {
    success: Boolean!
    message: String!
    restoredCollections: [String!]!
    totalDocs: Int!
  }

  type BackupClusterStatus {
    connected: Boolean!
    host: String
    backupCount: Int!
    lastBackup: String
    totalSize: Float!
  }

  type BackupSizeHistoryPoint {
    date: String!
    size: Float!
    collections: Int!
    name: String!
    status: String!
  }

  type LiveCollectionStats {
    name: String!
    documentCount: Int!
    size: Float!
    avgObjSize: Float!
    storageSize: Float!
    indexes: Int!
  }

  type LiveDatabaseStats {
    databaseName: String!
    totalCollections: Int!
    totalDocuments: Int!
    dataSize: Float!
    storageSize: Float!
    indexSize: Float!
    avgObjectSize: Float!
    collections: [LiveCollectionStats!]!
    largestCollection: LiveCollectionStats
    indexes: Int!
  }

  type BackupSizeByCollection {
    collections: Int!
    size: Float!
    name: String!
  }

  type BackupAnalytics {
    sizeHistory: [BackupSizeHistoryPoint!]!
    totalBackups: Int!
    completedBackups: Int!
    failedBackups: Int!
    successRate: Float!
    averageSize: Float!
    totalSize: Float!
    sizeByCollections: [BackupSizeByCollection!]!
  }

  type BackupScheduleConfig {
    interval: String!
    retention: Int!
    enabled: Boolean!
  }

  extend type Query {
    backups: [BackupRecord!]!
    backupClusterStatus: BackupClusterStatus!
    backupAnalytics: BackupAnalytics!
    backupScheduleConfig: BackupScheduleConfig!
    liveDatabaseStats: LiveDatabaseStats!
  }

  extend type Mutation {
    triggerBackup: BackupRecord!
    restoreBackup(backupId: ID!, collections: [String!]): RestoreResult!
    deleteBackup(backupId: ID!): Boolean!
    updateBackupScheduleConfig(interval: String, retention: Int, enabled: Boolean): BackupScheduleConfig!
  }

  type StripePaymentIntent {
    clientSecret: String!
    paymentIntentId: String!
    publishableKey: String!
    paymentId: ID!
  }

  type Notification {
    id: ID!
    userId: ID!
    type: String!
    title: String!
    message: String!
    link: String
    read: Boolean!
    createdAt: String!
  }

  type Subscription {
    messageAdded(conversationId: ID): Message
    notificationAdded(userId: ID!): Notification
  }
  input WorkflowStageInput {
    id: String!
    label: String!
    color: String!
    order: Int!
    type: String!
  }

  # Application Phase Management Types
  type ApplicationPhase {
    id: ID!
    programId: ID!
    name: String!
    description: String
    order: Int!
    requiredDeliverables: [Deliverable!]!
    estimatedDurationDays: Int
    enableApproval: Boolean!
    approvalType: String
    notificationOnCompletion: Boolean
    isInterviewPhase: Boolean
    allowMeetingScheduling: Boolean
    createdAt: String!
    updatedAt: String!
  }

  type Deliverable {
    type: String!
    name: String!
    required: Boolean!
    description: String
    maxFileSize: Int
  }

  type ApplicationPhaseSubmission {
    id: ID!
    applicationId: ID!
    phaseId: ID!
    submissionData: [SubmissionData!]!
    submittedAt: String!
    reviewStatus: String!
    reviewedBy: User
    reviewedAt: String
    reviewNotes: String
    rejectionReason: String
    revisionRequestNotes: String
    isLatestSubmission: Boolean!
    submissionNumber: Int!
    createdAt: String!
    updatedAt: String!
  }

  type SubmissionData {
    deliverableType: String!
    deliverableName: String!
    value: String
    fileUrl: String
    fileName: String
  }

  type ApplicationMeeting {
    id: ID!
    applicationId: ID!
    phaseId: ID!
    scheduledBy: User!
    scheduledFor: User!
    meetingType: String!
    title: String!
    description: String
    scheduledDate: String!
    scheduledTime: String!
    duration: Int!
    location: String
    meetingLink: String
    status: String!
    confirmedAt: String
    confirmedBy: User
    completedAt: String
    meetingNotes: String
    feedback: MeetingFeedback
    attendees: [MeetingAttendee!]!
    reminderSent: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type MeetingFeedback {
    rating: Int
    comments: String
    performanceGrade: PerformanceGrade
  }

  type PerformanceGrade {
    grade: String!
    color: String!
  }

  type MeetingAttendee {
    userId: ID!
    user: User
    role: String!
    attended: Boolean
  }

  type UserAssignedTask {
    id: ID!
    userId: ID!
    assignedBy: User!
    title: String!
    description: String!
    status: String!
    priority: String!
    dueDate: String
    relatedApplication: ID
    relatedPhase: ID
    attachments: [TaskAttachment!]
    checklist: [ChecklistItem!]
    assignedDate: String!
    completedDate: String
    createdAt: String!
    updatedAt: String!
  }



  type ChecklistItem {
    item: String!
    completed: Boolean!
  }

  type TaskTracking {
    id: ID!
    taskId: ID!
    statusHistory: [StatusHistory!]!
    timeSpent: TimeSpent!
    progressPercentage: Int!
    progressUpdates: [ProgressUpdate!]!
    createdAt: String!
    updatedAt: String!
  }

  type StatusHistory {
    status: String!
    changedAt: String!
    changedBy: User!
    notes: String
  }

  type TimeSpent {
    total: Int!
    sessions: [TimeSession!]!
  }

  type TimeSession {
    startTime: String!
    endTime: String
    duration: Int!
    notes: String
  }

  type ProgressUpdate {
    date: String!
    percentage: Int!
    notes: String
    updatedBy: User!
  }

  type ApplicationProgress {
    application: InternshipApplication!
    currentPhase: ApplicationPhase
    completedPhases: [PhaseCompletion!]!
    totalPhases: Int!
  }

  type PhaseCompletion {
    phaseId: ID!
    completedAt: String!
    approvedBy: User!
    notes: String
  }

  type TaskStats {
    totalTasks: Int!
    completed: Int!
    pending: Int!
    inProgress: Int!
    totalTimeSpent: Int!
    avgCompletionRate: Float!
    overdueTasks: Int!
  }

  extend type Query {
    # Application Phase Queries
    getApplicationPhases(programId: ID!): [ApplicationPhase!]!
    getApplicationPhase(phaseId: ID!): ApplicationPhase
    getApplicationPhaseSubmissions(applicationId: ID!): [ApplicationPhaseSubmission!]!
    getApplicantsByPhase(programId: ID!, phaseId: ID!): [InternshipApplication!]!
    getApplicationMeetings(applicationId: ID!): [ApplicationMeeting!]!
    getPendingMeetings(adminId: ID!): [ApplicationMeeting!]!
    getUserAssignedTasks(userId: ID!, status: String): [UserAssignedTask!]!
    getTasksByAssignedBy(adminId: ID!, status: String): [UserAssignedTask!]!
    getTaskWithTracking(taskId: ID!): TaskTracking
    getApplicationProgress(applicationId: ID!): ApplicationProgress
    getTaskStats(adminId: ID!): TaskStats!
  }

  extend type Mutation {
    # Application Phase Mutations
    createApplicationPhase(
      programId: ID!
      name: String!
      description: String
      order: Int!
      requiredDeliverables: [DeliverableInput!]
      estimatedDurationDays: Int
      enableApproval: Boolean
      approvalType: String
      notificationOnCompletion: Boolean
      isInterviewPhase: Boolean
      allowMeetingScheduling: Boolean
    ): ApplicationPhase!

    updateApplicationPhase(
      phaseId: ID!
      name: String
      description: String
      order: Int
      requiredDeliverables: [DeliverableInput!]
      estimatedDurationDays: Int
      enableApproval: Boolean
      approvalType: String
      isInterviewPhase: Boolean
      allowMeetingScheduling: Boolean
    ): ApplicationPhase!

    deleteApplicationPhase(phaseId: ID!): Boolean!
    reorderApplicationPhases(programId: ID!, phaseIds: [ID!]!): [ApplicationPhase!]!

    # Application Submission Mutations
    submitPhaseDeliverable(
      applicationId: ID!
      phaseId: ID!
      submissionData: [SubmissionDataInput!]!
    ): ApplicationPhaseSubmission!

    approvePhaseSubmission(
      applicationId: ID!
      phaseId: ID!
      approvedBy: ID!
      notes: String
      moveToNextPhase: Boolean
    ): InternshipApplication!

    rejectPhaseSubmission(
      applicationId: ID!
      phaseId: ID!
      rejectedBy: ID!
      rejectionReason: String!
      allowResubmission: Boolean
    ): InternshipApplication!

    requestRevision(
      applicationId: ID!
      phaseId: ID!
      requestedBy: ID!
      revisionNotes: String!
    ): ApplicationPhaseSubmission!

    moveApplicationToPhase(
      applicationId: ID!
      phaseId: ID!
      movedBy: ID!
      notes: String
    ): InternshipApplication!

    # Meeting Mutations
    scheduleApplicationMeeting(
      applicationId: ID!
      phaseId: ID!
      scheduledBy: ID!
      scheduledFor: ID!
      meetingType: String!
      title: String!
      description: String
      scheduledDate: String!
      scheduledTime: String!
      duration: Int
      location: String
      meetingLink: String
      attendees: [AttendeeInput!]
    ): ApplicationMeeting!

    confirmApplicationMeeting(
      meetingId: ID!
      confirmedBy: ID!
    ): ApplicationMeeting!

    cancelApplicationMeeting(
      meetingId: ID!
      cancelledBy: ID!
      reason: String
    ): ApplicationMeeting!

    completeMeeting(
      meetingId: ID!
      notes: String!
      rating: Int
      performanceGrade: PerformanceGradeInput
      attendanceData: [AttendanceDataInput!]
    ): ApplicationMeeting!

    markMeetingAsNoShow(meetingId: ID!): ApplicationMeeting!

    # Task Mutations
    assignTask(
      userId: ID!
      assignedBy: ID!
      title: String!
      description: String!
      priority: String
      dueDate: String
      relatedApplication: ID
      relatedPhase: ID
      attachments: [TaskAttachmentInput!]
      checklist: [ChecklistItemInput!]
    ): UserAssignedTask!

    updateTaskStatus(
      taskId: ID!
      newStatus: String!
      updatedBy: ID!
      notes: String
    ): UserAssignedTask!

    updateTaskProgressPhase(
      taskId: ID!
      progressPercentage: Int!
      updatedBy: ID!
      notes: String
    ): TaskTracking!

    logTimeSpent(
      taskId: ID!
      duration: Int!
      notes: String
    ): TaskTracking!

    completeChecklistItem(
      taskId: ID!
      itemIndex: Int!
    ): UserAssignedTask!

    cancelTask(
      taskId: ID!
      cancelledBy: ID!
      reason: String
    ): UserAssignedTask!

    # Performance Grading
    setPerformanceGrade(
      applicationId: ID!
      grade: String!
      color: String!
      feedbackType: String!
      feedbackBy: ID!
      notes: String
    ): InternshipApplication!

    setInternshipPerformanceGrade(
      internshipId: ID!
      grade: String!
      color: String!
      feedbackType: String!
      feedbackBy: ID!
      notes: String
    ): Internship!
  }

  input DeliverableInput {
    type: String!
    name: String!
    required: Boolean!
    description: String
    maxFileSize: Int
  }

  input SubmissionDataInput {
    deliverableType: String!
    deliverableName: String!
    value: String
    fileUrl: String
    fileName: String
  }

  input AttendeeInput {
    userId: ID!
    role: String!
  }

  input AttendanceDataInput {
    userId: ID!
    attended: Boolean!
  }

  input PerformanceGradeInput {
    grade: String!
    color: String!
  }


  input ChecklistItemInput {
    item: String!
    completed: Boolean
  }

  # ─── Project Onboarding Types ────────────────────────────────────────────
  type OnboardingChecklistItem {
    task: String!
    completed: Boolean!
    completedAt: String
  }

  type ProjectOnboarding {
    id: ID!
    projectId: ID!
    developerId: ID
    developer: User
    role: String!
    status: String!
    checklist: [OnboardingChecklistItem!]!
    createdAt: String!
  }

  # ─── Project Application Types ────────────────────────────────────────────
  type ProjectApplicationDocuments {
    overviewUrl: String
    featuresUrl: String
    technicalUrl: String
  }

  type ProjectApplication {
    id: ID!
    clientId: ID!
    client: User
    title: String!
    description: String!
    status: String!
    ndaSigned: Boolean!
    signerName: String
    signedAt: String
    reviewNotes: String
    ndaPdfUrl: String
    assignedAdmin: User
    requiredDocuments: ProjectApplicationDocuments
    createdAt: String!
    updatedAt: String!
  }

  type SignedNDA {
    id: ID!
    applicationId: ID!
    clientId: ID!
    client: User
    signerName: String!
    signerEmail: String!
    signedAt: String
    signerIp: String
    signatureHash: String
    pdfUrl: String
    status: String!
    createdAt: String!
    updatedAt: String!
  }

  type NDADailyLimitStatus {
    limit: Int!
    used: Int!
    remaining: Int!
  }

  input ProjectApplicationDocumentsInput {
    overviewUrl: String
    featuresUrl: String
    technicalUrl: String
  }

  input ProjectApplicationInput {
    title: String!
    description: String!
    documents: ProjectApplicationDocumentsInput
  }

  type ResourceItem {
    title: String!
    url: String!
  }

  type DeveloperFeedback {
    id: ID
    userId: ID!
    user: User
    message: String!
    resources: [ResourceItem!]
    createdAt: String!
  }

  input ResourceItemInput {
    title: String!
    url: String!
  }

  # ─── Project Kanban Board Types ────────────────────────────────────────────
  type ProjectTask {
    id: ID!
    projectId: ID!
    project: Project
    title: String!
    description: String
    status: String!
    priority: String!
    assignee: User
    assigneeId: ID
    labels: [String]
    storyPoints: Int
    dueDate: String
    order: Int!
    dependencies: [ID]
    approved: Boolean!
    feedback: String
    developerFeedback: [DeveloperFeedback!]
    createdAt: String!
    updatedAt: String!
  }

  extend type Query {
    projectTasks(projectId: ID!): [ProjectTask!]!
    projectTask(id: ID!): ProjectTask
    myProjectTasks(status: String): [ProjectTask!]!
    projectBoardStats(projectId: ID!): ProjectBoardStats!
    projectOnboarding(projectId: ID!): [ProjectOnboarding!]!
    projectApplications(status: String): [ProjectApplication!]!
    # Client-facing queries
    myProjectApplications: [ProjectApplication!]!
    getSignedNDA(applicationId: ID!): SignedNDA
    ndaDailyLimitStatus: NDADailyLimitStatus!
    projectByApplicationId(applicationId: ID!): Project
    getClients: [User!]!
    getClientWithDetails(clientId: ID!): ClientDetails
    usersWithLocation(role: String): [User!]!
    getUserFullReport(userId: ID!): UserFullReport!
    getRegisteredCompanies: [String!]!
    getCourseEnrolledStudents(courseId: ID!): [User!]!
    getAvailableAdmins: [User!]!
    # Error Reporting
    getErrorReports(page: Int, limit: Int, status: String, errorType: String, severity: String, componentName: String, search: String): ErrorReportResponse!
    getErrorReport(id: ID!): ErrorReport
    getErrorReportStats: ErrorReportStats!
  }

  type ProjectBoardStats {
    totalTasks: Int!
    backlogCount: Int!
    todoCount: Int!
    inProgressCount: Int!
    inReviewCount: Int!
    doneCount: Int!
    blockedCount: Int!
    completedPercentage: Float!
    overdueTasks: Int!
  }

  type ProjectDeveloperTask {
    id: ID!
    title: String!
    status: String!
    priority: String!
    dueDate: String
    order: Int!
    approved: Boolean!
    feedback: String
    assigneeId: ID
  }

  type DeveloperTaskSummary {
    developer: User!
    totalTasks: Int!
    todoTasks: Int!
    inProgressTasks: Int!
    inReviewTasks: Int!
    doneTasks: Int!
    blockedTasks: Int!
    progressPercentage: Int!
    tasks: [ProjectDeveloperTask!]!
  }

  extend type Query {
    projectDeveloperTaskSummary(projectId: ID!): [DeveloperTaskSummary!]!
  }

  # ─── Full User Report Types ───────────────────────────────────────────────
  type UserReportUser {
    id: ID!
    username: String!
    email: String!
    role: String!
    fullName: String
    avatar: String
    phone: String
    location: String
    title: String
    bio: String
    school: String
    level: Int
    xp: Int
    streak: Int
    createdAt: String
  }

  type UserReportStats {
    totalCourses: Int!
    totalCoursesCompleted: Int!
    courseCompletionRate: Int!
    totalLessonsCompleted: Int!
    averageGrade: Int
    totalGrades: Int!
    totalProjects: Int!
    completedProjects: Int!
    projectCompletionRate: Int!
    totalInternships: Int!
    activeInternships: Int!
    totalSubmissions: Int!
    passedSubmissions: Int!
  }

  type ReportCourseProgress {
    courseId: ID!
    courseTitle: String!
    courseThumbnail: String
    courseLevel: String
    courseCategory: String
    overallProgress: Int!
    status: String!
    totalTimeSpent: Int!
    lastAccessed: String
    completedLessons: Int!
    totalLessons: Int!
    averageGrade: Int
    gradesCount: Int!
    submissionsCount: Int!
    submissions: [ReportSubmission!]!
  }

  type ReportSubmission {
    submissionId: ID!
    lessonId: String!
    status: String!
    grade: Int
    totalScore: Int
    feedback: String
    submittedAt: String
  }

  type ReportGrade {
    courseId: ID
    lessonId: ID
    lessonTitle: String
    score: Int
    feedback: String
    gradedAt: String
  }

  type ReportProject {
    id: ID!
    title: String!
    course: String
    type: String!
    status: String!
    progress: Int!
    grade: String
    feedback: String
    deadline: String
    submittedAt: String
    createdAt: String
    tasks: [ReportTask!]!
  }

  type ReportTask {
    title: String!
    completed: Boolean!
    approved: Boolean
  }

  type ReportInternship {
    id: ID!
    title: String!
    organization: String
    cohort: String
    status: String!
    stage: String
    currentStage: Int
    progress: Int!
    startDate: String
    endDate: String
    mentor: ReportMentor
    sprintReviews: [SprintReviewEntry!]!
    milestones: [MilestoneEntry!]!
    tasks: [InternshipTaskEntry!]!
    meetings: [MeetingEntry!]!
  }

  type ReportMentor {
    id: ID!
    username: String!
    fullName: String
  }

  type SprintReviewEntry {
    week: Int
    grade: Int
    feedback: String
    date: String
  }

  type MilestoneEntry {
    title: String!
    completed: Boolean!
    date: String
  }

  type InternshipTaskEntry {
    title: String!
    status: String
    priority: String
  }

  type MeetingEntry {
    title: String!
    time: String
    type: String
  }

  type UserFullReport {
    user: UserReportUser!
    stats: UserReportStats!
    courses: [ReportCourseProgress!]!
    submissions: [ReportSubmission!]!
    grades: [ReportGrade!]!
    projects: [ReportProject!]!
    internships: [ReportInternship!]!
    certificates: [ReportCertificate!]!
  }

  type ReportCertificate {
    id: ID!
    courseTitle: String!
    status: String!
    grade: Int
    progress: Int
    issueDate: String
    credentialId: String
    requirements: [RequirementEntry!]!
  }

  type RequirementEntry {
    title: String!
    completed: Boolean!
    current: Int
    total: Int
  }

  type StudentProjectSummary {
    student: User!
    totalProjects: Int!
    completedProjects: Int!
    inProgressProjects: Int!
    pendingReviewProjects: Int!
    averageProgress: Float!
    projects: [Project!]!
    totalTasks: Int!
    completedTasks: Int!
    inProgressTasks: Int!
    pendingTasks: Int!
    inReviewTasks: Int!
    taskCompletionPercentage: Float!
  }

  extend type Mutation {
    assignDeveloperToProject(
      projectId: ID!
      developerId: ID!
      role: String!
      checklistTasks: [String!]!
    ): ProjectOnboarding!

    updateOnboardingChecklist(
      onboardingId: ID!
      taskIndex: Int!
      completed: Boolean!
    ): ProjectOnboarding!

    reviewProjectApplication(
      applicationId: ID!
      status: String!
      notes: String
    ): ProjectApplication!

    initializeProjectFromApplication(
      applicationId: ID!
      course: String!
      mentorIds: [ID!]!
    ): Project!

    createProjectTask(
      projectId: ID!
      title: String!
      description: String
      priority: String
      assigneeId: ID
      labels: [String]
      storyPoints: Int
      dueDate: String
      dependencies: [ID]
    ): ProjectTask!

    updateProjectTask(
      id: ID!
      title: String
      description: String
      status: String
      priority: String
      assigneeId: ID
      labels: [String]
      storyPoints: Int
      dueDate: String
      order: Int
      dependencies: [ID]
    ): ProjectTask!

    moveProjectTask(id: ID!, status: String!, order: Int): ProjectTask!
    deleteProjectTask(id: ID!): Boolean!
    approveProjectTask(id: ID!, feedback: String): ProjectTask!
    assignProjectTask(id: ID!, assigneeId: ID!): ProjectTask!
    sendTaskFeedback(taskId: ID!, message: String!, resources: [ResourceItemInput!]): ProjectTask!

    # Cache Invalidation
    invalidateReportCache(userId: ID!): Boolean
    clearReportCache: Boolean

    # Client-facing mutations
    submitProjectApplication(
      title: String!
      description: String!
      documents: ProjectApplicationDocumentsInput
      assignedAdminId: ID
    ): ProjectApplication!

    claimProjectApplication(applicationId: ID!): ProjectApplication!

    signProjectNDA(
      applicationId: ID!
      signerName: String!
    ): ProjectApplication!

    submitClientEvaluation(
      projectId: ID!
      rating: Int!
      comment: String!
    ): Project!

    # Project Stage Mutations
    addProjectStage(
      projectId: ID!
      name: String!
      description: String
      order: Int!
      dueDate: String
    ): Project!

    updateProjectStage(
      projectId: ID!
      order: Int!
      name: String
      description: String
      status: String
      assigneeId: ID
      dueDate: String
    ): Project!

    assignProjectStage(
      projectId: ID!
      order: Int!
      assigneeId: ID!
    ): Project!

    completeProjectStage(
      projectId: ID!
      order: Int!
    ): Project!

    removeProjectStage(
      projectId: ID!
      order: Int!
    ): Project!
  }

  # ─── Admin Commission Types ────────────────────────────────────────────────
  type CommissionConfig {
    id: ID!
    adminId: User!
    scope: String! # 'global' | 'course' | 'internship'
    scopeId: ID
    scopeTitle: String
    percentage: Float!
    description: String
    active: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type CommissionEntry {
    paymentId: ID!
    itemTitle: String!
    type: String!
    amount: Float!
    commissionPercentage: Float!
    commissionAmount: Float!
    scope: String!
    scopeTitle: String
    createdAt: String!
  }

  type CommissionReport {
    adminId: ID!
    configs: [CommissionConfig!]!
    totalCommission: Float!
    totalPayments: Int!
    commissionEntries: [CommissionEntry!]!
  }

  type AdminCommissionSummary {
    adminId: ID!
    adminName: String!
    adminEmail: String!
    totalCommission: Float!
    totalPayments: Int!
    activeConfigsCount: Int!
    recentEntries: [CommissionEntry!]!
  }

  type AllCommissionReports {
    totalAdmins: Int!
    grandTotalCommission: Float!
    grandTotalPayments: Int!
    adminReports: [AdminCommissionSummary!]!
  }

  extend type Query {
    commissionConfigs: [CommissionConfig!]!
    getAdminCommissionConfigs(adminId: ID!): [CommissionConfig!]!
    getAdminCommissionReport(adminId: ID!): CommissionReport!
    getAllCommissionReports: AllCommissionReports!
    getAllCompletedPayments: [PaymentTransaction!]!
    getCommissionAdmins: [User!]!
  }

  # ─── Disbursement / Commission Distribution Types ─────────────────────────
  type CommissionDisbursement {
    id: ID!
    paymentId: ID!
    customerId: ID!
    ownerId: ID!
    ownerPhone: String!
    itemId: ID!
    itemType: String!
    grossAmount: Float!
    platformCommission: Float!
    commissionType: String!
    commissionValue: Float!
    netAmount: Float!
    status: String!
    releaseDate: String
    approvedBy: ID
    approvedAt: String
    holdNote: String
    intouchTransactionRef: String
    intouchReferenceId: String
    failureReason: String
    retryCount: Int!
    autoDisbursement: Boolean!
    statusHistory: [DisbursementStatusEntry!]!
    createdAt: String!
    updatedAt: String!
  }

  type DisbursementStatusEntry {
    status: String!
    timestamp: String!
    note: String
  }

  type DisbursementResponse {
    items: [CommissionDisbursement!]!
    pagination: PaginationInfo!
  }

  type DisbursementStats {
    totalDisbursements: Int!
    onHoldCount: Int!
    pendingCount: Int!
    processingCount: Int!
    successfulCount: Int!
    failedCount: Int!
    totalDisbursed: Float!
    totalCommission: Float!
    pendingToDisburse: Float!
  }

  # ─── PawaPay Status Types ──────────────────────────────────────────────
  type PawaPayStatus {
    connected: Boolean!
    activeConfigs: Int!
    countries: [String!]!
    message: String
  }

  type PawaPayWalletBalance {
    currency: String!
    available: Float!
    pending: Float
    reserved: Float
  }

  type PawaPayBalanceResult {
    success: Boolean!
    balances: [PawaPayWalletBalance!]!
    message: String
  }

  # ─── IntouchPay Types ──────────────────────────────────────────────────
  type IntouchBalance {
    balance: Float!
    currency: String!
    success: Boolean!
    message: String
    raw: String
  }

  type SendMoneyResult {
    success: Boolean!
    message: String!
    transactionId: String
    referenceId: String
    amount: Float
    phoneNumber: String
  }

  extend type Query {
    # Disbursement queries
    getAllDisbursements(page: Int, limit: Int, status: String, ownerId: ID): DisbursementResponse!
    getMyDisbursements(page: Int, limit: Int, status: String): DisbursementResponse!
    getDisbursementStats: DisbursementStats!
    getDisbursement(id: ID!): CommissionDisbursement    getPlatformCommissionConfig: CommissionPlatformConfig!
    getHoldDaysConfig: Int!

  # IntouchPay queries
    getIntouchBalance: IntouchBalance!
    getPawaPayStatus: PawaPayStatus!
    getPawaPayBalance: PawaPayBalanceResult!
  }

  type CommissionPlatformConfig {
    type: String!
    value: Float!
    autoDisbursement: Boolean!
    disbursementPrimaryProvider: String!
  }

  extend type Mutation {
    # Commission config mutations
    updatePlatformCommissionConfig(type: String!, value: Float!): CommissionPlatformConfig!
    toggleAutoDisbursement(enabled: Boolean!): CommissionPlatformConfig!
    setDisbursementPrimaryProvider(provider: String!): CommissionPlatformConfig!
    setHoldDaysConfig(days: Int!): Int!

    # Disbursement mutations
    retryDisbursement(id: ID!): CommissionDisbursement!
    manualDisburse(paymentId: ID!, amount: Float!, phoneNumber: String!, reason: String): CommissionDisbursement!
    approveDisbursement(id: ID!): CommissionDisbursement!
    forceApproveDisbursement(id: ID!): CommissionDisbursement!
    voidDisbursement(id: ID!, reason: String): CommissionDisbursement!

    # IntouchPay mutations — direct money sending (salary, mentor/trainer payments)
    sendDirectMoney(amount: Float!, phoneNumber: String!, reason: String): SendMoneyResult!

    # IntouchPay deposit — initiate CASHIN (admin top-up via their own phone)
    requestIntouchPayment(amount: Float!, phoneNumber: String!, reason: String): SendMoneyResult!

    # Original commission config
    setCommission(adminId: ID!, scope: String!, scopeId: ID, scopeTitle: String, type: String, percentage: Float, fixedAmount: Float, description: String): CommissionConfig!
    toggleCommission(id: ID!): CommissionConfig!
    deleteCommission(id: ID!): Boolean!
  }

  # ─── Scholarship Types ──────────────────────────────────────────────────────
  type Scholarship {
    id: ID!
    userId: ID!
    user: User
    grantedBy: ID!
    grantedByUser: User
    type: String! # 'course' | 'internship'
    itemId: ID!
    itemTitle: String!
    status: String! # 'pending' | 'active' | 'revoked'
    reason: String
    approvedAt: String
    approvedBy: ID
    approvedByUser: User
    revokedAt: String
    revokedBy: ID
    revokedByUser: User
    revokedReason: String
    grantedLatitude: Float
    grantedLongitude: Float
    grantedCity: String
    grantedCountry: String
    createdAt: String!
    updatedAt: String!
  }

  type ScholarshipResponse {
    items: [Scholarship!]!
    pagination: PaginationInfo!
  }

  extend type Query {
    getAllScholarships(page: Int, limit: Int, status: String, type: String): ScholarshipResponse!
    getUserScholarships(userId: ID!): [Scholarship!]!
    getScholarshipStats: ScholarshipStats!
  }

  type PerAdminStat {
    adminId: ID!
    total: Int!
    active: Int!
    pending: Int!
    revoked: Int!
  }

  type ScholarshipStats {
    totalScholarships: Int!
    pendingScholarships: Int!
    activeScholarships: Int!
    courseScholarships: Int!
    internshipScholarships: Int!
    perAdmin: [PerAdminStat!]
  }

  extend type Mutation {
    grantScholarship(
      userId: ID!
      type: String! # 'course' | 'internship'
      itemId: ID!
      itemTitle: String!
      reason: String
      grantedLatitude: Float
      grantedLongitude: Float
      grantedCity: String
      grantedCountry: String
    ): Scholarship!

    grantBatchScholarships(
      userIds: [ID!]!
      type: String! # 'course' | 'internship'
      itemIds: [ID!]!
      itemTitles: [String!]
      reason: String
      grantedLatitude: Float
      grantedLongitude: Float
      grantedCity: String
      grantedCountry: String
    ): Int!

    approveScholarship(
      id: ID!
    ): Scholarship!

    revokeScholarship(
      id: ID!
      reason: String!
    ): Scholarship!
  }

  # ─── Bulk Notification Types ────────────────────────────────────────────────
  type BulkNotificationResult {
    success: Boolean!
    totalRecipients: Int!
    notificationsSent: Int!
    emailsSent: Int!
    errors: [String]
  }

  extend type Mutation {
    sendBulkNotification(
      title: String!
      message: String!
      link: String
      targetRole: String
      userIds: [ID!]
      teamIds: [ID!]
      sendEmail: Boolean!
      sendNotification: Boolean!
    ): BulkNotificationResult!
  }

  # ─── Upload Log Types ────────────────────────────────────────────────────────
  type UploadLog {
    id: ID!
    adminId: User!
    adminUsername: String!
    fileName: String!
    fileSize: Int!
    mimeType: String!
    url: String!
    publicId: String
    type: String!
    action: String!
    createdAt: String!
  }

  type UploadLogResponse {
    items: [UploadLog!]!
    pagination: PaginationInfo!
  }

  extend type Query {
    uploadLogs(page: Int, limit: Int, type: String): UploadLogResponse!
  }

  extend type Mutation {
    deleteUploadLog(id: ID!): Boolean!
    clearAllUploadLogs: Boolean!
  }

  extend type Mutation {
    # Error Reporting
    reportClientError(input: ReportClientErrorInput!): Boolean!
    resolveErrorReport(id: ID!, resolution: String): ErrorReport!
    deleteErrorReport(id: ID!): Boolean!
  }

  # ─── Scheduled Broadcast Types ───────────────────────────────────────────
  type ScheduledBroadcast {
    id: ID!
    title: String!
    message: String!
    link: String
    targetRole: String
    userIds: [String]
    teamIds: [String]
    sendEmail: Boolean!
    sendNotification: Boolean!
    scheduledAt: String!
    status: String!
    sentAt: String
    createdBy: User!
    result: BroadcastResult
    createdAt: String!
    updatedAt: String!
  }

  type BroadcastResult {
    totalRecipients: Int
    notificationsSent: Int
    emailsSent: Int
    errors: [String]
  }

  type ScheduledBroadcastResponse {
    items: [ScheduledBroadcast!]!
    pagination: PaginationInfo!
  }

  extend type Query {
    scheduledBroadcasts(page: Int, limit: Int, status: String): ScheduledBroadcastResponse!
  }

  extend type Mutation {
    scheduleBroadcast(
      title: String!
      message: String!
      link: String
      targetRole: String
      userIds: [ID!]
      teamIds: [ID!]
      sendEmail: Boolean!
      sendNotification: Boolean!
      scheduledAt: String!
    ): ScheduledBroadcast!

    updateScheduledBroadcast(
      id: ID!
      title: String
      message: String
      link: String
      targetRole: String
      userIds: [ID!]
      teamIds: [ID!]
      sendEmail: Boolean
      sendNotification: Boolean
      scheduledAt: String
    ): ScheduledBroadcast!

    cancelScheduledBroadcast(id: ID!): ScheduledBroadcast!
    deleteScheduledBroadcast(id: ID!): Boolean!
  }

  # ─── Refund Request Types ────────────────────────────────────────────────────
  type RefundRequest {
    id: ID!
    paymentId: ID!
    userId: ID!
    user: User
    itemIds: [ID!]!
    itemTypes: [String!]!
    amount: Float!
    currency: String!
    reason: String!
    status: String!
    adminNote: String
    verifiedBy: ID
    verifiedAt: String
    approvedBy: ID
    approvedAt: String
    forceApproved: Boolean!
    cancelledDisbursements: [ID!]
    refundedAmount: Float!
    refundFee: Float!
    refundableAmountAfterFee: Float!
    requestedBy: ID!
    createdAt: String!
    updatedAt: String!
  }

  type RefundRequestResponse {
    items: [RefundRequest!]!
    pagination: PaginationInfo!
  }

  type RefundRequestStats {
    totalRequests: Int!
    pendingCount: Int!
    verifiedCount: Int!
    approvedCount: Int!
    rejectedCount: Int!
    totalRefunded: Float!
    totalRefundFee: Float!
  }

  extend type Query {
    getAllRefundRequests(page: Int, limit: Int, status: String): RefundRequestResponse!
    getRefundRequest(id: ID!): RefundRequest
    getRefundRequestStats: RefundRequestStats!
  }

  extend type Mutation {
    requestRefund(
      paymentId: ID!
      reason: String!
    ): RefundRequest!

    verifyRefundRequest(
      id: ID!
      note: String
    ): RefundRequest!

    approveRefund(
      id: ID!
      note: String
    ): RefundRequest!

    forceApproveRefund(
      id: ID!
      note: String
    ): RefundRequest!

    rejectRefund(
      id: ID!
      reason: String!
    ): RefundRequest!
  }

  # ─── Client Details Type ────────────────────────────────────────────────────
  type ClientProjectSummary {
    id: ID!
    title: String!
    status: String!
    progress: Int!
    createdAt: String!
  }

  type ClientDetails {
    id: ID!
    fullName: String
    email: String!
    avatar: String
    createdAt: String
    totalApplications: Int!
    approvedApplications: Int!
    activeProjects: Int!
    applications: [ProjectApplication!]!
    projects: [ClientProjectSummary!]!
  }

  # ─── Error Reporting Types ──────────────────────────────────────────────────
  type ErrorReport {
    id: ID!
    userId: ID
    username: String
    errorType: String!
    severity: String!
    message: String!
    stack: String
    componentName: String
    operationName: String
    statusCode: Int
    url: String!
    userAgent: String
    browserInfo: ErrorReportBrowserInfo
    context: JSON
    status: String!
    resolvedBy: User
    resolvedAt: String
    resolution: String
    occurrenceCount: Int!
    fingerprint: String!
    createdAt: String!
    updatedAt: String!
  }

  type ErrorReportBrowserInfo {
    name: String
    version: String
    os: String
    mobile: Boolean
  }

  type ErrorReportStats {
    total: Int!
    open: Int!
    investigating: Int!
    resolved: Int!
    dismissed: Int!
    critical: Int!
    high: Int!
    medium: Int!
    low: Int!
    byType: [ErrorReportTypeCount!]!
    byComponent: [ErrorReportComponentCount!]!
  }

  type ErrorReportTypeCount {
    errorType: String!
    count: Int!
  }

  type ErrorReportComponentCount {
    componentName: String!
    count: Int!
  }

  type ErrorReportResponse {
    items: [ErrorReport!]!
    pagination: PaginationInfo!
  }

  input ReportClientErrorInput {
    errorType: String!
    message: String!
    stack: String
    componentName: String
    operationName: String
    statusCode: Int
    context: String
  }
`;
