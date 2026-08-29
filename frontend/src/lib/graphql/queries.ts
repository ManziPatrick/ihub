import { gql } from "@apollo/client";

export const PAGINATION_FRAGMENT = gql`
  fragment PaginationFragment on PaginationInfo {
    totalCount
    totalPages
    currentPage
    pageSize
    hasNextPage
    hasPreviousPage
  }
`;

export const GET_UNREAD_NOTIFICATIONS = gql`
  query GetUnreadNotifications {
    unreadNotificationCount
  }
`;

export const GET_USER_PROFILE = gql`
  query GetUserProfile($userId: ID!) {
    user(id: $userId) {
      id
      username
      email
      role
      fullName
      avatar
      bio
      isOnline
      lastActive
      level
      xp
      streak
      academicStatus
      enrolledCourses {
        id
        title
        thumbnail
      }
      badges {
        badge {
          id
          title
          icon
        }
        awardedAt
      }
      studentProfile {
        school
        educationLevel
        fieldOfStudy
        skills
        portfolioUrl
        githubUrl
        linkedinUrl
      }
    }
  }
`;

export const GET_STATS = gql`
  query GetStats {
    stats {
      totalUsers
      totalCourses
      totalStudents
      totalRevenue
    }
  }
`;


export const GET_USERS = gql`
  query GetUsers($page: Int, $limit: Int, $createdBy: ID, $role: String, $roleIn: [String], $sortBy: String) {
    users(page: $page, limit: $limit, createdBy: $createdBy, role: $role, roleIn: $roleIn, sortBy: $sortBy) {
      items {
        id
        username
        email
        role
        permissions
        school
        status
        createdAt
        isExternal
        isDeleted
        enrolledCourses {
          id
          title
          thumbnail
          level
        }
        completedCourses {
          id
          title
        }
        completedLessons {
          courseId
          lessonId
        }
        courseProgress {
          courseId
          lessonId
          updatedAt
        }
        activityLog {
          action
          details
          timestamp
        }
        createdBy {
          id
          username
          fullName
        }
        studentProfile {
          id
          school
          educationLevel
          academicYear
          fieldOfStudy
          city
          sector
          cell
          village
          skills
          availability
          bio
          linkedinUrl
          githubUrl
          portfolioUrl
          isComplete
          completionPercentage
        }
      }
      pagination {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const GET_ALL_STUDENTS = gql`
  query GetAllStudents {
    getAllStudents {
      id
      username
      fullName
      email
      avatar
      role
    }
  }
`;

export const GET_TOP_STUDENTS = gql`
  query GetTopStudents($courseId: ID, $limit: Int) {
    getTopStudents(courseId: $courseId, limit: $limit) {
      id
      username
      email
      role
      level
      xp
      avatar
      studentProfile {
        school
      }
      enrolledCourses {
        id
        title
      }
    }
  }
`;

export const GET_ANALYTICS_EXPORT = gql`
  query GetAnalyticsExport {
    getAnalyticsExport
  }
`;

export const GET_USER_CERTIFICATES = gql`
  query GetUserCertificates($userId: ID!) {
    getUserCertificates(userId: $userId) {
      id
      courseTitle
      issueDate
      credentialId
      status
      grade
      progress
      requirements {
        title
        completed
        current
        required
      }
      student {
        id
        username
      }
      course {
        id
        title
        school
      }
      downloadUrl
    }
  }
`;

export const GET_TRAINERS_PUBLIC = gql`
  query GetTrainers($page: Int, $limit: Int, $search: String) {
    trainers(page: $page, limit: $limit, search: $search) {
      items {
        id
        username
        fullName
        email
        avatar
        coverImage
        role
        title
        bio
        location
        isTrainerApproved
        isProfilePublic
        trainerApplication {
          specialties
          experienceYears
          teachingPhilosophy
          qualifications
          rateHourly
          linkedinProfile
          status
        }
      }
      pagination {
        totalCount
        totalPages
        currentPage
        pageSize
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

export const GET_TRAINER_PUBLIC_PROFILE = gql`
  query GetTrainerPublicProfile($id: ID!) {
    trainerPublicProfile(id: $id) {
      id
      username
      fullName
      email
      avatar
      coverImage
      role
      title
      bio
      phone
      location
      isTrainerApproved
      level
      xp
      createdAt
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
      trainerCourses {
        id
        title
        descriptionSnippet
        thumbnail
        price
        discountPrice
        level
        category
        studentsEnrolledCount
      }
      trainerPrograms {
        id
        title
        description
        duration
        price
        currency
        image
        status
      }
    }
  }
`;

export const GET_ALL_TRAINERS = gql`
  query GetAllTrainers {
    getAllTrainers {
      id
      username
      fullName
      email
      avatar
      role
    }
  }
`;

export const GET_CONVERSATIONS = gql`
  query GetConversations {
    conversations {
      id
      participants {
        id
        username
      }
      lastMessage {
        id
        content
        createdAt
        sender {
           username
        }
      }
      updatedAt
    }
  }
`;

export const GET_MESSAGES = gql`
  query GetMessages($conversationId: ID!) {
    messages(conversationId: $conversationId) {
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

export const GET_CHAT_GREETING = gql`
  query GetChatGreeting {
    chatBotGreeting {
      content
      role
      action
      actionData
    }
  }
`;

export const GET_COURSES = gql`
  query GetCourses($page: Int, $limit: Int, $sortBy: String, $featured: Boolean) {
    courses(page: $page, limit: $limit, sortBy: $sortBy, featured: $featured) {
      items {
        id
        title
        descriptionSnippet
        description
        thumbnail
        price
        discountPrice
        level
        category
        status
        enrollmentMode
        allowedDeliveryModes
        submissionRequired
        school
        isFeatured
        instructor {
          id
          username
        }
        studentsEnrolled {
          id
          username
        }
        createdAt
        applicationQuestions {
          label
          type
          required
          options
        }
        modules {
          id
          title
          description
          lessons {
            id
            title
            duration
            content
            videoUrl
            fileUrl
            type
            isAssignment
            requiredAssignment
            assignmentDescription
            assignmentQuestions {
              id
              questionText
              type
              options
              correctOptionIndex
              explanation
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
          }
        }
      }
      pagination {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const GET_COURSES_SUMMARY = gql`
  query GetCoursesSummary($page: Int, $limit: Int, $sortBy: String, $featured: Boolean, $search: String, $category: String, $price: String, $level: String, $school: String) {
    courses(page: $page, limit: $limit, sortBy: $sortBy, featured: $featured, search: $search, category: $category, price: $price, level: $level, school: $school) {
      items {
        id
        title
        descriptionSnippet
        thumbnail
        price
        discountPrice
        level
        category
        enrollmentMode
        school
        isFeatured
        status
        instructor {
          id
          username
        }
        createdAt
      }
      pagination {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const GET_COURSES_LITE_SUMMARY = gql`
  query GetCoursesLiteSummary($page: Int, $limit: Int, $sortBy: String, $featured: Boolean) {
    courses(page: $page, limit: $limit, sortBy: $sortBy, featured: $featured) {
      items {
        id
        title
        descriptionSnippet
        description
        thumbnail
        price
        discountPrice
        level
        category
        enrollmentMode
        school
        isFeatured
        status
        sequentialLock
        modulesCount
        totalLessonsCount
        studentsEnrolledCount
        instructor {
          id
          username
        }
        createdAt
      }
      pagination {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const GET_COURSE = gql`
  query GetCourse($id: ID!) {
    course(id: $id, lite: false) {
      id
      title
      description
      thumbnail
      price
      discountPrice
      level
      category
      status
      school
      isFeatured
      enrollmentMode
      allowedDeliveryModes
      submissionRequired
      sequentialLock
      instructor {
        id
        username
      }
      applicationQuestions {
        label
        type
        required
        options
      }
      modules {
        id
        title
        description
        lessons {
          id
          title
          duration
          content
          videoUrl
          fileUrl
          type
          requiredAssignment
          isAssignment
          assignmentDescription
          assignmentDeliverables
          assignmentQuestions {
            id
            questionText
            type
            options
            correctOptionIndex
            explanation
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
          }
          quizConfig {
            disableRightClick
            timeLimit
            quizType
            questionsPerPage
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
      studentsEnrolled {
        id
        username
      }
    }
  }
`;

export const GET_COURSE_LITE = gql`
  query GetCourseLite($id: ID!) {
    course(id: $id, lite: true) {
      id
      title
      description
      thumbnail
      price
      discountPrice
      level
      category
      status
      school
      isFeatured
      enrollmentMode
      allowedDeliveryModes
      submissionRequired
      instructor {
        id
        username
      }
      applicationQuestions {
        label
        type
        required
        options
      }
      modules {
        id
        title
        description
        lessons {
          id
          title
          duration
          type
        }
      }
      studentsEnrolled {
        id
        username
      }
    }
  }
`;

export const GET_LESSON_CONTENT = gql`
  query GetLessonContent($courseId: ID!, $lessonId: ID!) {
    lessonContent(courseId: $courseId, lessonId: $lessonId) {
      id
      title
      content
      videoUrl
      fileUrl
      duration
      type
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
        explanation
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
      }
      quizConfig {
        disableRightClick
        timeLimit
        quizType
        questionsPerPage
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
    }
  }
`;

export const GET_ME = gql`
  query GetMe {
    me {
      id
      username
      email
      role
      permissions
      status
      fullName
      avatar
      title
      bio
      phone
      location
      isFirst
      createdAt
      enrolledCourses {
        id
        title
        thumbnail
        price
        discountPrice
        level
        category
        school
        modulesCount
        totalLessonsCount
        status
      }
      completedLessons {
        courseId
        lessonId
      }
      completedCourses {
        id
      }
      badges {
        badge {
          id
          title
          icon
          category
        }
        awardedAt
      }
      level
      xp
      academicStatus
      streak
      themePreference {
        primaryColor
        mode
        lightBg
        darkBg
      }
      studentProfile {
        id
        isComplete
        school
        educationLevel
        academicYear
        fieldOfStudy
        city
        sector
        cell
        village
        skills
        availability
        bio
        linkedinUrl
        githubUrl
        portfolioUrl
        completionPercentage
      }
      isTrainerApproved
      isProfilePublic
      coverImage
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
        appliedAt
      }
    }
  }
`;

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories
  }
`;

export const GET_SCHOOLS = gql`
  query GetSchools {
    schools
  }
`;

export const GET_TRAINER_STUDENTS = gql`
  query GetTrainerStudents {
    trainerStudents {
      id
      username
      email
      fullName
      bio
      phone
      location
      avatar
      createdAt
      completedLessons {
        courseId
        lessonId
      }
      enrolledCourses {
        id
        title
        level
        modules {
          id
          title
          lessons {
            id
            title
          }
        }
      }
      completedLessons {
        courseId
        lessonId
      }
      activityLog {
        action
        details
        timestamp
      }
      badges {
        badge {
          id
          title
          description
          icon
          category
        }
        awardedAt
      }
      grades {
        courseId
        lessonId
        score
        feedback
      }
      level
      academicStatus
      bookings {
        id
        type
        date
        time
        topic
        notes
        status
        meetingLink
        mentor {
          id
          username
        }
        createdAt
      }
    }
  }
`;
export const GET_RECENT_ACTIVITY = gql`
  query GetRecentActivity($createdBy: ID) {
    recentActivity(createdBy: $createdBy) {
      username
      action
      details
      timestamp
    }
  }
`;

export const GET_QUESTIONS = gql`
  query GetQuestions($courseId: ID!, $lessonId: ID, $moduleNumber: String, $lessonNumber: String) {
    questions(courseId: $courseId, lessonId: $lessonId, moduleNumber: $moduleNumber, lessonNumber: $lessonNumber) {
      id
      courseId
      lessonId
      moduleNumber
      lessonNumber
      questionText
      type
      options
      correctOptionIndex
      matchingPairs {
        id
        left
        right
      }
      explanation
      createdAt
    }
  }
`;

export const GET_MY_BOOKINGS = gql`
  query GetMyBookings {
    myBookings {
      id
      type
      date
      time
      topic
      notes
      status
      meetingLink
      contextType
      contextTitle
      mentor {
        id
        username
        fullName
        email
        avatar
      }
      user {
        id
        username
        fullName
        email
        avatar
      }
      createdAt
    }
  }
`;

export const GET_MY_PAYMENTS = gql`
  query GetMyPayments {
    myPayments {
      id
      type
      itemTitle
      amount
      currency
      date
      status
      method
      proofOfPaymentUrl
      adminNotes
      courses {
        id
        title
        price
      }
      internships {
        id
        title
        price
      }
    }
  }
`;

export const GET_ALL_BOOKINGS = gql`
  query GetAllBookings($page: Int, $limit: Int) {
    bookings(page: $page, limit: $limit) {
      items {
        id
        type
        date
        time
        topic
        notes
        status
        meetingLink
        user {
          id
          username
        }
        mentor {
          id
          username
        }
        createdAt
      }
      pagination {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const GET_BADGES = gql`
  query GetBadges($page: Int, $limit: Int, $createdBy: ID) {
    badges(page: $page, limit: $limit, createdBy: $createdBy) {
      items {
        id
        title
        description
        icon
        category
        createdBy {
          id
          username
        }
      }
      pagination {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const GET_CONFIGS = gql`
  query GetConfigs {
    configs {
      id
      key
      value
      description
    }
  }
`;

export const GET_MY_PROJECTS = gql`
  query GetMyProjects($status: String) {
    myProjects(status: $status) {
      id
      title
      course
      type
      status
      progress
      deadline
      submittedAt
      grade
      feedback
      userId
      user {
        id
        username
      }
      team {
        userId
        name
        role
        user {
          id
          username
          isOnline
        }
      }
      mentors {
        id
        username
      }
      milestones {
        title
        dueDate
        completed
      }
      tasks {
        id
        title
        completed
        approved
        feedback
      }
      documentation {
        images
        videos
        links {
          title
          url
        }
        inPersonNotes
      }
      description
      submissionUrl
      createdAt
      updatedAt
    }
  }
`;

export const GET_PROJECT = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      id
      title
      course
      type
      status
      progress
      deadline
      submittedAt
      grade
      feedback
      team {
        userId
        name
        role
        user {
          id
          username
        }
      }
      mentors {
        id
        username
      }
      milestones {
        title
        description
        dueDate
        completed
        deliverables
        feedback
        aiAnalysis
        submissions {
          url
          submittedAt
          status
          feedback
        }
      }
      tasks {
        id
        title
        completed
        approved
        feedback
      }
      documentation {
        images
        videos
        links {
          title
          url
        }
        inPersonNotes
      }
      description
      submissionUrl
      user {
        id
        username
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_ALL_PROJECTS = gql`
  query GetAllProjects($page: Int, $limit: Int, $course: String) {
    projects(page: $page, limit: $limit, course: $course) {
      items {
        id
        title
        course
        type
        status
        progress
        deadline
        submittedAt
        grade
        feedback
        description
        submissionUrl
        conversationId
        team {
          userId
          name
          role
          user {
            id
            username
            fullName
            avatar
            email
          }
        }
        mentors {
          id
          username
        }
        tasks {
          id
          title
          completed
        }
        user {
          id
          username
          fullName
          avatar
          email
        }
        createdAt
        updatedAt
      }
      pagination {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const GET_MY_CERTIFICATES = gql`
  query GetMyCertificates {
    myCertificates {
      id
      courseTitle
      issueDate
      credentialId
      status
      grade
      progress
      requirements {
        title
        completed
        current
        total
      }
      course {
        id
        title
        school
      }
      createdAt
      updatedAt
      signerName
      signerSignature
      recipientName
    }
  }
`;

export const GET_CERTIFICATE = gql`
  query GetCertificate($id: ID!) {
    certificate(id: $id) {
      id
      courseTitle
      issueDate
      credentialId
      status
      progress
      signerName
      signerSignature
      recipientName
      requirements {
        title
        completed
        current
        total
      }
      user {
        id
        username
      }
      course {
        id
        title
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_COMPLETED_USERS = gql`
  query GetCompletedUsers($page: Int, $limit: Int, $createdBy: ID, $courseId: ID, $search: String) {
    completedUsers(page: $page, limit: $limit, createdBy: $createdBy, courseId: $courseId, search: $search) {
      items {
        id
        user {
          id
          username
          email
          fullName
          avatar
          role
        }
        completedCourseIds
        completedCourses {
          id
          title
          category
          level
        }
        hasCertificate
        certificate {
          id
          courseTitle
          issueDate
          credentialId
          status
          grade
          progress
        }
        completedLessonsCount
        overallProgress
        completedAt
        status
        examScore
      }
      pagination {
        totalCount
        totalPages
        currentPage
        pageSize
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

export const GET_ALL_CERTIFICATES = gql`
  query GetAllCertificates {
    certificates {
      id
      courseTitle
      issueDate
      credentialId
      status
      progress
      user {
        id
        username
      }
      createdAt
    }
  }
`;

export const GET_MY_INTERNSHIPS = gql`
  query GetMyInternships($status: String) {
    myInternships(status: $status) {
      id
      title
      organization
      company
      status
      stage
      startDate
      endDate
      mentor {
        id
        username
      }
      user {
        id
        username
        avatar
      }
    }
  }
`;

export const GET_MY_INTERNSHIP = gql`
  query GetMyInternship {
    myInternship {
      id
      title
      organization
      company
      startDate
      endDate
      duration
      type
      status
      stage
      projects {
        id
        title
        status
        grade
        feedback
        conversationId
        team {
          userId
          name
          role
          user {
            id
            username
          }
        }
        mentors {
          id
          username
        }
        conversationId
        team {
          userId
          name
          role
        }
      }
      assignedProject {
        id
        title
        description
        status
        requiredSkills
      }
      payment {
        amount
        currency
        status
        paidAt
        discount
        isPaidProgram
        installmentsAllowed
      }
      progress
      milestones {
        title
        completed
        date
      }
      tasks {
        id
        title
        status
        priority
      }
      meetings {
        title
        time
        type
      }
      mentor {
        id
        username
      }
      mentors {
        id
        username
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_DAILY_DASHBOARD = gql`
  query GetDailyDashboard {
    dailyDashboard {
      tasks {
        id
        title
        deadline
        priority
        type
        status
        sourceId
      }
      meetings {
        title
        time
        type
      }
      unreadMessages
      aiSuggestion
      motivationalQuote
      resources {
        id
        title
        type
        source
        url
      }
    }
  }
`;

export const GET_INTERNSHIP = gql`
  query GetInternship($id: ID!) {
    internship(id: $id) {
      id
      title
      organization
      company
      startDate
      endDate
      duration
      type
      status
      stage
      cohort
      projects {
        id
        title
        status
        grade
        feedback
        conversationId
        team {
          userId
          name
          role
          user {
            id
            username
          }
        }
        mentors {
          id
          username
        }
      }
      payment {
        amount
        currency
        status
        paidAt
        discount
      }
      progress
      milestones {
        title
        completed
        date
      }
      tasks {
        id
        title
        status
        priority
      }
      meetings {
        title
        time
        type
      }
      user {
        id
        username
      }
      mentor {
        id
        username
      }
      mentors {
        id
        username
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_INTERNSHIP_STANDUPS = gql`
  query GetInternshipStandups($internshipId: ID!) {
    getInternshipStandups(internshipId: $internshipId) {
      id
      date
      yesterday
      today
      blockers
      workLink
      attendanceStatus
      trainerFeedback
      user {
        id
        username
      }
    }
  }
`;

export const GET_ALL_INTERNSHIPS = gql`
  query GetAllInternships($page: Int, $limit: Int) {
    internships(page: $page, limit: $limit) {
      items {
        id
        title
        organization
        company
        duration
        type
        status
        stage
        cohort
        user {
          id
          username
          fullName
          avatar
        }
        mentor {
          id
          username
        }
        mentors {
          id
          username
        }
        progress
        currentStage
        sprintReviews {
          week
          grade
          feedback
        }
        tasks {
          id
          title
          status
          priority
        }
        createdAt
      }
      pagination {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const GET_TRAINER_STATS = gql`
  query GetTrainerStats {
    trainerStats {
      activeCourses
      totalStudents
      pendingReviews
      mentees
    }
  }
`;

export const GET_ADMIN_DASHBOARD_DATA = gql`
  query GetAdminDashboardData($createdBy: ID) {
    adminDashboardData(createdBy: $createdBy) {
      stats {
        totalUsers
        totalCourses
        totalStudents
        totalRevenue
      }
      recentEnrollments {
        studentName
        courseTitle
        enrolledAt
        amount
      }
      coursePerformance {
        courseTitle
        studentCount
        avgCompletion
        revenue
      }
    }
  }
`;

export const GET_PAYMENT_STATS = gql`
  query GetPaymentStats {
    paymentStats {
      totalRevenue
      thisMonthRevenue
      pendingValue
      pendingCount
      internshipRevenue
    }
  }
`;

export const GET_PAYMENTS = gql`
  query GetPayments($page: Int, $limit: Int, $createdBy: ID, $search: String, $status: String) {
    payments(page: $page, limit: $limit, createdBy: $createdBy, search: $search, status: $status) {
      items {
        id
        studentName
        amount
        currency
        itemTitle
        type
        status
        date
        method
        proofOfPaymentUrl
        adminNotes
        createdBy {
          id
          username
        }
      }
      pagination {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

// --- New Internship Module Queries ---

export const GET_INTERNSHIP_PROGRAMS = gql`
  query GetInternshipPrograms($page: Int, $limit: Int, $search: String, $category: String, $price: String, $level: String, $school: String) {
    internshipPrograms(page: $page, limit: $limit, search: $search, category: $category, price: $price, level: $level, school: $school) {
      items {
        id
        title
        organization
        organizationLogo
        description
        duration
        startDate
        endDate
        applicationDeadline
        status
        price
        discount
        currency
        image
        eligibility
        rules
        maxSpots
      }
      pagination {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const GET_INTERNSHIP_PROGRAM = gql`
  query GetInternshipProgram($id: ID!) {
    internshipProgram(id: $id) {
      id
      title
      organization
      organizationLogo
      description
      duration
      startDate
      endDate
      applicationDeadline
      status
      price
      discount
      currency
      image
      maxSpots
      eligibility
      rules
      allowedDeliveryModes
      signerName
      signerSignature
      applicationQuestions {
        label
        type
        required
        options
        maxFileSize
        acceptedFileTypes
      }
    }
  }
`;

export const GET_INTERNSHIP_APPLICATIONS = gql`
  query GetInternshipApplications($programId: ID, $status: String, $page: Int, $limit: Int) {
    internshipApplications(programId: $programId, status: $status, page: $page, limit: $limit) {
      items {
        id
        status
        skills
        availability
        portfolioUrl
        applicationAnswers {
          questionLabel
          answer
        }
        rejectionReason
        createdAt
        user {
          id
          username
          email
          fullName
          avatar
          phone
          studentProfile {
            school
            fieldOfStudy
            educationLevel
            githubUrl
            linkedinUrl
          }
        }
        internshipProgram {
          id
          title
          price
          duration
        }
      }
      pagination {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const GET_MY_INTERNSHIP_APPLICATIONS = gql`
  query GetMyInternshipApplications {
    myInternshipApplications {
      id
      status
      rejectionReason
      internshipProgram {
        id
        title
        price
        currency
        status
      }
      payment {
        id
        status
        amount
        currency
      }
      createdAt
    }
  }
`;

export const GET_INTERNSHIP_PROJECTS_NEW = gql`
  query GetInternshipProjects($programId: ID, $page: Int, $limit: Int) {
    internshipProjects(programId: $programId, page: $page, limit: $limit) {
      items {
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
        internshipProgram {
          id
          title
        }
      }
      pagination {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const GET_INTERNSHIP_PROJECT_NEW = gql`
  query GetInternshipProject($id: ID!) {
    internshipProject(id: $id) {
      id
      title
      description
      requiredSkills
      status
      documentation {
        links {
          title
          url
        }
      }
      teamSizeRange {
        min
        max
      }
      internshipProgram {
        id
        title
      }
      milestones {
        id
        title
        deadline
        order
      }
    }
  }
`;

export const GET_INTERNSHIP_TEAMS = gql`
  query GetInternshipTeams($programId: ID, $page: Int, $limit: Int) {
    internshipTeams(programId: $programId, page: $page, limit: $limit) {
      items {
        id
        name
        status
        type
        mentor {
          id
          username
          fullName
          avatar
        }
        members {
          id
          userId
          user {
            id
            username
            fullName
            avatar
          }
          role
        }
        internshipProgramId
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
      pagination {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const GET_MY_INTERNSHIP_TEAM = gql`
  query GetMyInternshipTeam {
    myInternshipTeam {
      id
      name
      status
      type
      internshipProjectId
      internshipProject {
        id
        title
        description
        milestones {
          id
          title
          description
          deadline
          completed
          order
        }
      }
      mentor {
        id
        username
        fullName
        avatar
        email
      }
      members {
        id
        role
        user {
          id
          username
        }
      }
    }
  }
`;

export const GET_INTERNSHIP_SPRINTS = gql`
  query GetInternshipSprints($projectId: ID!, $teamId: ID) {
    internshipSprints(projectId: $projectId, teamId: $teamId) {
      id
      title
      goal
      startDate
      endDate
      status
      order
    }
  }
`;

export const GET_INTERNSHIP_TASKS = gql`
  query GetInternshipTasks($projectId: ID!, $teamId: ID, $sprintId: ID) {
    internshipTasks(projectId: $projectId, teamId: $teamId, sprintId: $sprintId) {
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
      attachments {
        name
        url
        type
      }
      comments {
        id
        content
        createdAt
        author {
          id
          username
          avatar
        }
      }
      sprintId
      createdAt
      updatedAt
    }
  }
`;

export const GET_INTERNSHIP_PROJECT_FULL = gql`
  query GetInternshipProjectFull($id: ID!) {
    internshipProject(id: $id) {
      id
      title
      description
      document
      defaultTickets {
        title
        description
        priority
        taskType
        labels
        order
      }
      documentation {
        blueprint
        links {
          title
          url
        }
      }
      internshipProgram {
        id
        title
      }
      milestones {
        id
        title
        deadline
        order
      }
    }
  }
`;

export const GET_INTERNSHIP_SUBMISSIONS = gql`
  query GetInternshipSubmissions($teamId: ID!) {
    internshipSubmissions(teamId: $teamId) {
      id
      workUrl
      description
      status
      feedback
      createdAt
      user {
        username
      }
      milestoneId
      milestone {
        id
        title
      }
    }
  }
`;



export const GET_ANALYTICS = gql`
  query GetAnalytics($createdBy: ID) {
    analytics(createdBy: $createdBy) {
      userGrowth {
        label
        value
      }
      revenueGrowth {
        label
        value
      }
      courseDistribution {
        name
        value
      }
      roleDistribution {
        name
        value
      }
      internshipStats {
        total
        eligible
        enrolled
        graduated
      }
      projectStats {
        total
        completed
        pendingReview
        inProgress
      }
    }
  }
`;

export const GET_BRANDING = gql`
  query GetBranding {
    branding {
      primaryColor
      secondaryColor
      accentColor
      logoUrl
      siteName
      portalTitle
      maintenanceMode
    }
  }
`;

export const GET_MY_MENTEES = gql`
  query GetMyMentees {
    myMentees {
      id
      title
      organization
      duration
      type
      status
      stage
      currentStage
      cohort
      user {
        id
        username
        email
        fullName
        bio
        phone
        location
        avatar
        createdAt
        level
        academicStatus
        enrolledCourses {
          id
          title
          level
          modules {
            id
            title
            lessons {
              id
              title
            }
          }
        }
        completedLessons {
          courseId
          lessonId
        }
        activityLog {
          action
          details
          timestamp
        }
      }
      milestones {
        title
        completed
        date
      }
      sprintReviews {
        week
        grade
        feedback
        date
      }
    }
  }
`;


// ========== STUDENT PROFILE QUERIES ==========
export const GET_MY_STUDENT_PROFILE = gql`
  query GetMyStudentProfile {
    myStudentProfile {
      id
      userId
      school
      educationLevel
      fieldOfStudy
      skills
      availability
      bio
      linkedinUrl
      githubUrl
      portfolioUrl
      completionPercentage
      isComplete
      createdAt
      updatedAt
    }
  }
`;

export const GET_STUDENT_PROFILES = gql`
  query GetStudentProfiles {
    studentProfiles {
      id
      userId
      user {
        id
        username
        email
      }
      school
      educationLevel
      fieldOfStudy
      skills
      availability
      completionPercentage
      isComplete
    }
  }
`;

// ========== PAYMENT QUERIES ==========
export const GET_INTERNSHIP_PAYMENTS = gql`
  query GetInternshipPayments($programId: ID, $status: String) {
    internshipPayments(programId: $programId, status: $status) {
      id
      userId
      user {
        id
        username
        email
      }
      internshipProgramId
      internshipProgram {
        id
        title
      }
      amount
      currency
      status
      paymentMethod
      transactionId
      paidAt
      waivedBy
      waivedReason
      createdAt
    }
  }
`;

export const GET_MY_INTERNSHIP_PAYMENTS = gql`
  query GetMyInternshipPayments {
    myInternshipPayments {
      id
      internshipProgramId
      internshipProgram {
        id
        title
      }
      amount
      currency
      status
      paymentMethod
      paidAt
      createdAt
    }
  }
`;

// ========== INVOICE QUERIES ==========
export const GET_INTERNSHIP_INVOICES = gql`
  query GetInternshipInvoices($userId: ID) {
    internshipInvoices(userId: $userId) {
      id
      invoiceNumber
      userId
      user {
        id
        username
        email
      }
      internshipProgram {
        id
        title
      }
      amount
      currency
      issuedAt
      dueDate
      status
      items {
        description
        quantity
        unitPrice
        total
      }
    }
  }
`;

// ========== CERTIFICATE QUERIES ==========
export const GET_INTERNSHIP_CERTIFICATES = gql`
  query GetInternshipCertificates($programId: ID) {
    internshipCertificates(programId: $programId) {
      id
      userId
      user {
        id
        username
        email
      }
      internshipProgram {
        id
        title
      }
      certificateNumber
      issuedAt
      trainerName
      programTitle
      duration
      isRevoked
      verificationUrl
    }
  }
`;

export const GET_MY_INTERNSHIP_CERTIFICATES = gql`
  query GetMyInternshipCertificates {
    myInternshipCertificates {
      id
      certificateNumber
      internshipProgram {
        id
        title
      }
      programTitle
      duration
      startDate
      endDate
      completionDate
      issuedAt
      trainerName
      pdfUrl
      verificationUrl
      metadata {
        milestonesCompleted
        totalMilestones
        finalGrade
        skills
      }
    }
  }
`;

export const VERIFY_CERTIFICATE = gql`
  query VerifyCertificate($certificateNumber: String!) {
    verifyCertificate(certificateNumber: $certificateNumber) {
      id
      certificateNumber
      user {
        username
      }
      programTitle
      duration
      trainerName
      issuedAt
      completionDate
      isRevoked
      verificationUrl
    }
  }
`;

export const GET_INTERNSHIP_TIME_LOGS = gql`
  query GetInternshipTimeLogs($teamId: ID, $userId: ID) {
    internshipTimeLogs(teamId: $teamId, userId: $userId) {
      id
      minutes
      description
      date
      createdAt
      user {
        id
        username
      }
    }
  }
`;

export const GET_RESOURCES = gql`
  query GetResources($linkedTo: ID, $onModel: String) {
    getResources(linkedTo: $linkedTo, onModel: $onModel) {
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

export const GET_STUDENT_PROJECT_PROGRESS = gql`
  query GetStudentProjectProgress {
    studentProjectProgress {
      student {
        id
        username
        fullName
        email
        avatar
        role
      }
      totalProjects
      completedProjects
      inProgressProjects
      pendingReviewProjects
      averageProgress
      totalTasks
      completedTasks
      inProgressTasks
      pendingTasks
      inReviewTasks
      taskCompletionPercentage
      projects {
        id
        title
        course
        status
        progress
        deadline
        grade
        createdAt
        user {
          id
          username
        }
      }
    }
  }
`;

export const GET_CODE_EXERCISE_ANSWERS = gql`
  query GetCodeExerciseAnswers($courseId: ID!, $lessonId: String, $courseTitle: String) {
    getCodeExerciseAnswers(courseId: $courseId, lessonId: $lessonId, courseTitle: $courseTitle) {
      userId
      username
      email
      courseId
      courseTitle
      lessonId
      lessonTitle
      exerciseId
      exerciseTitle
      code
      submittedAt
    }
  }
`;

export const MY_CODE_EXERCISE_ANSWERS = gql`
  query MyCodeExerciseAnswers($courseId: ID!, $lessonId: ID!) {
    myCodeExerciseAnswers(courseId: $courseId, lessonId: $lessonId) {
      exerciseId
      code
      updatedAt
    }
  }
`;

export const GET_ASSIGNMENT_SUBMISSIONS = gql`
  query GetAssignmentSubmissions($courseId: ID, $lessonId: String, $page: Int, $limit: Int) {
    getAssignmentSubmissions(courseId: $courseId, lessonId: $lessonId, page: $page, limit: $limit) {
      items {
        id
        userId
        user {
          id
          username
          fullName
          avatar
        }
        courseId
        course {
          id
          title
          instructor {
            id
            fullName
            username
          }
        }
        lessonId
        lesson {
          title
          assignmentQuestions {
            id
            questionText
            type
            options
            correctOptionIndex
            points
          }
        }
        content
        status
        grade
        feedback
        totalScore
        timeTaken
        answers {
          questionId
          answerText
          score
          aiFeedback
        }
        createdAt
      }
      pagination {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;
export const GET_NOTIFICATIONS = gql`
  query GetNotifications {
    notifications {
      id
      type
      title
      message
      link
      read
      createdAt
    }
  }
`;

export const GET_PROJECT_TEMPLATES = gql`
  query GetProjectTemplates($category: String, $course: String) {
    projectTemplates(category: $category, course: $course) {
      id
      title
      description
      course
      type
      category
      visibility
      isTemplate
      deadline
      tasks {
        id
        title
      }
      milestones {
        title
      }
      documentation {
        links {
            title
            url
        }
      }
      status
      createdAt
    }
  }
`;

export const GET_INTERNSHIP_PROGRAM_FOR_APPLY = gql`
  query GetInternshipProgramForApply($id: ID!) {
    internshipProgram(id: $id) {
      id
      title
      organization
      organizationLogo
      description
      price
      currency
      applicationQuestions {
        label
        type
        required
        options
        maxFileSize
        acceptedFileTypes
      }
    }
    myInternshipApplications {
      id
      internshipProgramId
      status
    }
  }
`;

// ========== MEETING QUERIES ==========
export const GET_INTERNSHIP_MEETINGS = gql`
  query GetInternshipMeetings($teamId: ID, $programId: ID, $contextType: String) {
    getInternshipMeetings(teamId: $teamId, programId: $programId, contextType: $contextType) {
      id
      title
      description
      type
      meetLink
      startTime
      endTime
      contextType
      contextTitle
      teamIds
      teams {
        id
        name
      }
      host {
        id
        username
        fullName
      }
      recurrenceDays
      recurrenceEndDate
      status
      attendees {
        userId
        role
        attended
      }
    }
  }
`;

export const GET_MY_INTERNSHIP_MEETINGS = gql`
  query GetMyInternshipMeetings {
    getMyInternshipMeetings {
      id
      title
      description
      type
      meetLink
      startTime
      endTime
      contextType
      contextTitle
      courseIds
      recurrenceDays
      recurrenceEndDate
      host {
        id
        username
        fullName
      }
      status
      attendees {
        userId
        role
        attended
      }
    }
  }
`;

export const GET_MEETING_ATTENDANCE = gql`
  query GetMeetingAttendance($meetingId: ID!) {
    getMeetingAttendance(meetingId: $meetingId) {
      userId
      role
      attended
    }
  }
`;

export const GET_INTERNSHIP_ACTIVITY_LOGS = gql`
  query GetInternshipActivityLogs($programId: ID, $targetType: String, $targetId: ID, $page: Int, $limit: Int) {
    internshipActivityLogs(programId: $programId, targetType: $targetType, targetId: $targetId, page: $page, limit: $limit) {
      items {
        id
        action
        targetType
        targetId
        details
        createdAt
        user {
          username
          fullName
        }
      }
      pagination {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;
export const GET_MY_IP_GEOLOCATION = gql`
  query GetMyIpGeolocation {
    getMyIpGeolocation {
      latitude
      longitude
      city
      country
    }
  }
`;

export const GET_USERS_WITH_LOCATION = gql`
  query GetUsersWithLocation($role: String) {
    usersWithLocation(role: $role) {
      id
      username
      email
      role
      fullName
      avatar
      phone
      location
      latitude
      longitude
      locationUpdatedAt
      locationShared
      locationDenied
      title
      isOnline
      lastActive
      enrolledCourses {
        id
        title
      }
    }
  }
`;

export const GET_USER_FULL_REPORT = gql`
  query GetUserFullReport($userId: ID!) {
    getUserFullReport(userId: $userId) {
      user {
        id
        username
        email
        role
        fullName
        avatar
        phone
        location
        title
        bio
        school
        level
        xp
        streak
        createdAt
      }
      stats {
        totalCourses
        totalCoursesCompleted
        courseCompletionRate
        totalLessonsCompleted
        averageGrade
        totalGrades
        totalProjects
        completedProjects
        projectCompletionRate
        totalInternships
        activeInternships
        totalSubmissions
        passedSubmissions
        totalCreatedCourses
        totalCreatedPrograms
        totalManagedStudents
        totalApplications
        revenue
      }
      courses {
        courseId
        courseTitle
        courseThumbnail
        courseLevel
        courseCategory
        overallProgress
        status
        totalTimeSpent
        lastAccessed
        completedLessons
        totalLessons
        averageGrade
        gradesCount
        submissionsCount
        submissions {
          submissionId
          lessonId
          status
          grade
          totalScore
          feedback
          submittedAt
        }
      }
      submissions {
        submissionId
        courseId
        courseTitle
        lessonId
        status
        grade
        totalScore
        feedback
        submittedAt
      }
      grades {
        courseId
        lessonId
        lessonTitle
        score
        feedback
        gradedAt
      }
      projects {
        id
        title
        course
        type
        status
        progress
        grade
        feedback
        deadline
        submittedAt
        createdAt
        tasks {
          title
          completed
          approved
        }
      }
      internships {
        id
        title
        organization
        cohort
        status
        stage
        currentStage
        progress
        startDate
        endDate
        mentor {
          id
          username
          fullName
        }
        sprintReviews {
          week
          grade
          feedback
          date
        }
        milestones {
          title
          completed
          date
        }
        tasks {
          title
          status
          priority
        }
        meetings {
          title
          time
          type
        }
      }
      certificates {
        id
        courseTitle
        status
        grade
        progress
        issueDate
        credentialId
        requirements {
          title
          completed
          current
          total
        }
      }
      createdCourses {
        id
        title
        category
        level
        price
        status
        thumbnail
        studentsEnrolledCount
        modulesCount
        createdAt
        instructor {
          id
          username
          fullName
        }
      }
      createdPrograms {
        id
        title
        organization
        status
        price
        duration
        startDate
        endDate
        createdAt
      }
      managedStudents {
        id
        username
        fullName
        email
        avatar
        school
        createdAt
      }
      applications {
        id
        type
        title
        organization
        status
        appliedAt
      }
    }
  }
`;

export const GET_COURSE_ENROLLED_STUDENTS = gql`
  query GetCourseEnrolledStudents($courseId: ID!) {
    getCourseEnrolledStudents(courseId: $courseId) {
      id
      username
    }
  }
`;

export const GET_COURSE_APPLICATIONS = gql`
  query GetCourseApplications($courseId: ID, $status: String, $page: Int, $limit: Int) {
    courseApplications(courseId: $courseId, status: $status, page: $page, limit: $limit) {
      items {
        id
        courseId
        course {
          id
          title
        }
        userId
        user {
          id
          username
          fullName
          email
          studentProfile {
            id
            school
            educationLevel
            academicYear
            fieldOfStudy
            city
            sector
            cell
            village
            skills
            availability
            bio
            linkedinUrl
            githubUrl
            portfolioUrl
            isComplete
            completionPercentage
          }
        }
        status
        paymentStatus
        selectedDeliveryMode
        applicationAnswers {
          questionLabel
          answer
        }
        rejectionReason
        createdAt
      }
      pagination {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const MY_COURSE_APPLICATIONS = gql`
  query MyCourseApplications {
    myCourseApplications {
      id
      courseId
      course {
        id
        title
        thumbnail
      }
      status
      applicationAnswers {
        questionLabel
        answer
      }
      rejectionReason
      createdAt
    }
  }
`;

export const GET_ALL_USER_GRADE_REPORTS = gql`
  query GetAllUserGradeReports {
    allUserGradeReports {
      id
      userId
      username
      email
      courseTitle
      lessonTitle
      score
      gradedAt
      status
    }
  }
`;

export const GET_APPLICATION_PHASES = gql`
  query GetApplicationPhases($programId: ID!) {
    getApplicationPhases(programId: $programId) {
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

// ========== COMMISSION QUERIES ==========
export const GET_COMMISSION_CONFIGS = gql`
  query GetCommissionConfigs {
    commissionConfigs {
      id
      adminId {
        id
        username
        fullName
        email
      }
      scope
      scopeId
      scopeTitle
      percentage
      description
      active
      createdAt
      updatedAt
    }
  }
`;

export const GET_ADMIN_COMMISSION_CONFIGS = gql`
  query GetAdminCommissionConfigs($adminId: ID!) {
    getAdminCommissionConfigs(adminId: $adminId) {
      id
      scope
      scopeId
      scopeTitle
      percentage
      description
      active
      createdAt
    }
  }
`;

export const GET_ADMIN_COMMISSION_REPORT = gql`
  query GetAdminCommissionReport($adminId: ID!) {
    getAdminCommissionReport(adminId: $adminId) {
      adminId
      totalCommission
      totalPayments
      commissionEntries {
        paymentId
        itemTitle
        type
        amount
        commissionPercentage
        commissionAmount
        scope
        scopeTitle
        createdAt
      }
    }
  }
`;

export const GET_ALL_COMPLETED_PAYMENTS = gql`
  query GetAllCompletedPayments {
    getAllCompletedPayments {
      id
      studentName
      type
      itemTitle
      amount
      currency
      date
      status
      method
    }
  }
`;

export const GET_COMMISSION_ADMINS = gql`
  query GetCommissionAdmins {
    getCommissionAdmins {
      id
      username
      fullName
      email
    }
  }
`;

export const GET_ALL_COMMISSION_REPORTS = gql`
  query GetAllCommissionReports {
    getAllCommissionReports {
      totalAdmins
      grandTotalCommission
      grandTotalPayments
      adminReports {
        adminId
        adminName
        adminEmail
        totalCommission
        totalPayments
        activeConfigsCount
        recentEntries {
          paymentId
          itemTitle
          type
          amount
          commissionPercentage
          commissionAmount
          scope
          scopeTitle
          createdAt
        }
      }
    }
  }
`;

// ========== DISBURSEMENT QUERIES ==========
export const GET_ALL_DISBURSEMENTS = gql`
  query GetAllDisbursements($page: Int, $limit: Int, $status: String, $ownerId: ID) {
    getAllDisbursements(page: $page, limit: $limit, status: $status, ownerId: $ownerId) {
      items {
        id
        paymentId
        customerId
        ownerId
        ownerPhone
        itemId
        itemType
        grossAmount
        platformCommission
        commissionType
        commissionValue
        netAmount
        status
        releaseDate
        approvedBy
        approvedAt
        holdNote
        intouchTransactionRef
        intouchReferenceId
        failureReason
        retryCount
        autoDisbursement
        statusHistory {
          status
          timestamp
          note
        }
        createdAt
        updatedAt
      }
      pagination {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const GET_MY_DISBURSEMENTS = gql`
  query GetMyDisbursements($page: Int, $limit: Int, $status: String) {
    getMyDisbursements(page: $page, limit: $limit, status: $status) {
      items {
        id
        paymentId
        ownerPhone
        itemId
        itemType
        grossAmount
        platformCommission
        netAmount
        status
        releaseDate
        approvedBy
        approvedAt
        holdNote
        intouchTransactionRef
        intouchReferenceId
        failureReason
        retryCount
        createdAt
        updatedAt
      }
      pagination {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const GET_DISBURSEMENT_STATS = gql`
  query GetDisbursementStats {
    getDisbursementStats {
      totalDisbursements
      onHoldCount
      pendingCount
      processingCount
      successfulCount
      failedCount
      totalDisbursed
      totalCommission
      pendingToDisburse
    }
  }
`;

export const GET_PLATFORM_COMMISSION_CONFIG = gql`
  query GetPlatformCommissionConfig {
    getPlatformCommissionConfig {
      type
      value
      autoDisbursement
      disbursementPrimaryProvider
    }
  }
`;

export const GET_AVAILABLE_ADMINS = gql`
  query GetAvailableAdmins {
    getAvailableAdmins {
      id
      username
      fullName
      email
      role
    }
  }
`;

export const GET_INTOUCH_BALANCE = gql`
  query GetIntouchBalance {
    getIntouchBalance {
      balance
      currency
      success
      message
    }
  }
`;

export const GET_HOLD_DAYS_CONFIG = gql`
  query GetHoldDaysConfig {
    getHoldDaysConfig
  }
`;

export const GET_PAWAPAY_STATUS = gql`
  query GetPawaPayStatus {
    getPawaPayStatus {
      connected
      activeConfigs
      countries
      message
    }
  }
`;

export const GET_PAWAPAY_BALANCE = gql`
  query GetPawaPayBalance {
    getPawaPayBalance {
      success
      balances {
        currency
        available
        pending
        reserved
      }
      message
    }
  }
`;

export const GET_APPLICATION_PROGRESS = gql`
  query GetApplicationProgress($applicationId: ID!) {
    getApplicationProgress(applicationId: $applicationId) {
      application {
        id
        status
        performanceGrades {
          grade
          color
          feedbackType
        }
      }
      currentPhase {
        id
        name
        description
      }
      completedPhases {
        phaseId
        completedAt
      }
    }
  }
`;

// ========== REFUND REQUEST QUERIES ==========
export const GET_MY_REFUND_REQUESTS = gql`
  query GetMyRefundRequests {
    getMyRefundRequests {
      id
      paymentId
      amount
      currency
      reason
      status
      adminNote
      refundedAmount
      refundFee
      refundableAmountAfterFee
      createdAt
      updatedAt
    }
  }
`;

export const GET_ALL_REFUND_REQUESTS = gql`
  query GetAllRefundRequests($page: Int, $limit: Int, $status: String) {
    getAllRefundRequests(page: $page, limit: $limit, status: $status) {
      items {
        id
        paymentId
        userId
        user {
          id
          username
          fullName
          email
        }
        amount
        currency
        reason
        status
        adminNote
        verifiedAt
        approvedAt
        forceApproved
        refundedAmount
        refundFee
        refundableAmountAfterFee
        payoutMethod
        payoutReferenceId
        customerPhone
        createdAt
        updatedAt
      }
      pagination {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const GET_REFUND_REQUEST_STATS = gql`
  query GetRefundRequestStats {
    getRefundRequestStats {
      totalRequests
      pendingCount
      verifiedCount
      approvedCount
      rejectedCount
      totalRefunded
      totalRefundFee
    }
  }
`;

// ========== SCHOLARSHIP QUERIES ==========
export const GET_ALL_SCHOLARSHIPS = gql`
  query GetAllScholarships($page: Int, $limit: Int, $status: String, $type: String) {
    getAllScholarships(page: $page, limit: $limit, status: $status, type: $type) {
      items {
        id
        userId
        user {
          id
          username
          fullName
          email
        }
        grantedBy
        grantedByUser {
          id
          username
          fullName
        }
        type
        itemId
        itemTitle
        status
        reason
        approvedAt
        approvedBy
        approvedByUser {
          id
          username
          fullName
        }
        revokedAt
        revokedBy
        revokedByUser {
          id
          username
        }
        revokedReason
        grantedLatitude
        grantedLongitude
        grantedCity
        grantedCountry
        createdAt
        updatedAt
      }
      pagination {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const GET_USER_SCHOLARSHIPS = gql`
  query GetUserScholarships($userId: ID!) {
    getUserScholarships(userId: $userId) {
      id
      type
      itemId
      itemTitle
      status
      reason
      createdAt
    }
  }
`;

export const GET_SCHOLARSHIP_STATS = gql`
  query GetScholarshipStats {
    getScholarshipStats {
      totalScholarships
      activeScholarships
      courseScholarships
      internshipScholarships
      totalScholarships
      pendingScholarships
      activeScholarships
      courseScholarships
      internshipScholarships
      perAdmin {
        adminId
        total
        pending
        active
        revoked
      }
    }
  }
`;

export const GET_DISCOUNT_CODES = gql`
  query GetDiscountCodes($courseId: ID, $page: Int, $limit: Int) {
    discountCodes(courseId: $courseId, page: $page, limit: $limit) {
      items {
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
      pagination {
        totalCount
        totalPages
        currentPage
        pageSize
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

export const GET_DISCOUNT_CODE = gql`
  query GetDiscountCode($id: ID!) {
    discountCode(id: $id) {
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
      course {
        id
        title
        price
      }
    }
  }
`;


// ========== EVENT QUERIES ==========
export const GET_EVENTS = gql`
  query GetEvents($page: Int, $limit: Int, $type: String, $status: String, $search: String, $featured: Boolean, $upcoming: Boolean) {
    events(page: $page, limit: $limit, type: $type, status: $status, search: $search, featured: $featured, upcoming: $upcoming) {
      items {
        id
        title
        description
        shortDescription
        type
        startDate
        endDate
        timezone
        location
        isOnline
        meetingLink
        image
        price
        currency
        maxAttendees
        organizerName
        organizerBio
        tags
        status
        featured
        createdAt
        createdBy {
          id
          username
          fullName
          avatar
        }
      }
      pagination {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`

export const GET_EVENT = gql`
  query GetEvent($id: ID!) {
    event(id: $id) {
      id
      title
      description
      shortDescription
      type
      startDate
      endDate
      timezone
      location
      isOnline
      meetingLink
      image
      price
      currency
      maxAttendees
      organizerName
      organizerBio
      organizerPhoto
      tags
      status
      featured
      createdAt
      createdBy {
        id
        username
        fullName
        avatar
      }
    }
  }
`

// ========== EVENT APPLICATION QUERIES ==========
export const GET_EVENT_APPLICATIONS = gql`
  query GetEventApplications($eventId: ID, $status: String, $page: Int, $limit: Int) {
    eventApplications(eventId: $eventId, status: $status, page: $page, limit: $limit) {
      items {
        id
        status
        applicationAnswers {
          questionLabel
          answer
        }
        selectedDeliveryMode
        rejectionReason
        notes
        createdAt
        event {
          id
          title
          type
          startDate
          isOnline
          location
        }
        user {
          id
          username
          email
          fullName
          avatar
          phone
        }
      }
      pagination {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const GET_MY_EVENT_APPLICATIONS = gql`
  query GetMyEventApplications {
    myEventApplications {
      id
      status
      rejectionReason
      event {
        id
        title
        startDate
      }
      createdAt
    }
  }
`;

export const GET_UNIFIED_EVENTS = gql`
  query GetUnifiedEvents($page: Int, $limit: Int, $type: String, $search: String, $upcoming: Boolean) {
    unifiedEventsAndInternships(page: $page, limit: $limit, type: $type, search: $search, upcoming: $upcoming) {
      id
      title
      description
      shortDescription
      type
      source
      startDate
      endDate
      image
      price
      currency
      location
      isOnline
      tags
      status
      organizerName
      createdAt
    }
  }
`
export const GET_PUBLIC_TESTIMONIALS = gql`
  query GetPublicTestimonials {
    publicTestimonials {
      id
      quote
      authorName
      authorRole
      authorCompany
      authorAvatar
      rating
      status
      createdAt
    }
  }
`;

export const GET_MY_TESTIMONIALS = gql`
  query GetMyTestimonials {
    myTestimonials {
      id
      quote
      authorName
      authorRole
      authorCompany
      rating
      status
      reviewNote
      createdAt
      author {
        id
        fullName
      }
    }
  }
`;

export const GET_TESTIMONIALS = gql`
  query GetTestimonials($page: Int, $limit: Int, $status: String) {
    testimonials(page: $page, limit: $limit, status: $status) {
      items {
        id
        quote
        authorName
        authorRole
        authorCompany
        authorAvatar
        rating
        status
        reviewNote
        createdAt
        author {
          id
          fullName
          username
          email
          avatar
          school
        }
        submittedBy {
          id
          fullName
          username
          email
        }
      }
      pagination {
        totalCount
        totalPages
        currentPage
        pageSize
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;
