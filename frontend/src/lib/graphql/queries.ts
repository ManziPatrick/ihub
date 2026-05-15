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
  query GetUsers($page: Int, $limit: Int, $createdBy: ID) {
    users(page: $page, limit: $limit, createdBy: $createdBy) {
      items {
        id
        username
        email
        role
        permissions
        school
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

export const GET_COURSES = gql`
  query GetCourses($page: Int, $limit: Int) {
    courses(page: $page, limit: $limit) {
      items {
        id
        title
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

export const GET_COURSE = gql`
  query GetCourse($id: ID!) {
    course(id: $id) {
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
        }
      }
      studentsEnrolled {
        id
        username
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
        description
        thumbnail
        price
        discountPrice
        level
        category
        school
        modules {
          title
          description
          lessons {
            title
            duration
            type
            content
            videoUrl
            fileUrl
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
          description
          icon
          category
        }
        awardedAt
      }
      grades {
        courseId
        lessonId
        lesson {
          title
          type
        }
        score
        feedback
        gradedAt
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
      }
    }
  }
`;

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories
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
  query GetRecentActivity {
    recentActivity {
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
      options
      correctOptionIndex
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
      mentor {
        id
        username
      }
      user {
        id
        username
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
  query GetBadges($page: Int, $limit: Int) {
    badges(page: $page, limit: $limit) {
      items {
        id
        title
        description
        icon
        category
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
  query GetAllProjects($page: Int, $limit: Int) {
    projects(page: $page, limit: $limit) {
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
        }
        createdAt
        updatedAt
        stats {
          totalApplications
          approvedApplications
          rejectedApplications
          pendingApplications
          enrolledStudents
          totalRevenue
        }
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

export const GET_PAYMENTS = gql`
  query GetPayments($page: Int, $limit: Int) {
    payments(page: $page, limit: $limit) {
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
  query GetInternshipPrograms($page: Int, $limit: Int) {
    internshipPrograms(page: $page, limit: $limit) {
      items {
        id
        title
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
      description
      duration
      startDate
      endDate
      applicationDeadline
      status
      price
      currency
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
  query GetAnalytics {
    analytics {
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
      description
      price
      currency
      applicationQuestions {
        label
        type
        required
        options
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
  query GetInternshipMeetings($teamId: ID, $programId: ID) {
    getInternshipMeetings(teamId: $teamId, programId: $programId) {
      id
      title
      description
      type
      meetLink
      startTime
      endTime
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
      recurrenceDays
      recurrenceEndDate
      host {
        id
        username
        fullName
      }
      status
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
