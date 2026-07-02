#!/usr/bin/env python3
"""Insert phone validation into createCourse and updateCourse resolvers."""

filepath = "backend/src/graphql/resolvers.ts"

with open(filepath, "r") as f:
    lines = f.readlines()

# Find the line numbers first
create_auth_end = None
update_instructor_line = None

for i, line in enumerate(lines):
    if "createCourse: async" in line:
        # Find the closing "}" of the auth check (3 lines later)
        pass
    if "// Check ownership or admin role" in line:
        # updateCourse - find the instructorId line after this
        pass

# More precise: find exact positions
for i, line in enumerate(lines):
    # createCourse: after the auth check "      }" followed by empty line then "      const course = new Course"
    if "if (context.user.role !== 'trainer'" in line:
        create_auth_end = i + 1  # The "      }" closing the if block
        break

for i, line in enumerate(lines):
    if "if (instructorId) updateData.instructor = instructorId;" in line and i > 4050:
        update_instructor_line = i
        break

print(f"createCourse auth check closing at line {create_auth_end + 1}")
print(f"updateCourse instructorId line at line {update_instructor_line + 1}")

# ─── 1. Insert phone validation in createCourse ───
create_validation = [
    "\n",
    "      // Phone validation: if publishing, instructor must have a valid phone number for commission payouts\n",
    "      if ((args.status || 'published') === 'published') {\n",
    "        const instructorIdToCheck = instructorId || context.user.id;\n",
    "        const instructor = await User.findById(instructorIdToCheck).select('phone').lean();\n",
    "        if (!instructor || !instructor.phone || instructor.phone.trim() === '') {\n",
    "          throw new Error('Cannot publish course: Instructor must have a valid phone number registered for commission payouts. Please set a phone number in your profile first.');\n",
    "        }\n",
    "      }\n",
]

new_lines = lines[:create_auth_end+1] + create_validation + lines[create_auth_end+1:]

# ─── 2. Insert phone validation in updateCourse (after shifting) ───
update_validation = [
    "\n",
    "      // Phone validation: if publishing, instructor must have a valid phone number for commission payouts\n",
    "      if (args.status === 'published') {\n",
    "        const instructorIdToCheck = instructorId || course.instructor.toString();\n",
    "        const instructor = await User.findById(instructorIdToCheck).select('phone').lean();\n",
    "        if (!instructor || !instructor.phone || instructor.phone.trim() === '') {\n",
    "          throw new Error('Cannot publish course: Instructor must have a valid phone number registered for commission payouts. Please set a phone number in your profile first.');\n",
    "        }\n",
    "      }\n",
]

shift = len(create_validation)  # 10 lines
insert_pos_update = update_instructor_line + shift

new_lines = new_lines[:insert_pos_update+1] + update_validation + new_lines[insert_pos_update+1:]

with open(filepath, "w") as f:
    f.writelines(new_lines)

print(f"✅ Inserted phone validation")
print(f"   createCourse: after line {create_auth_end + 1}")
print(f"   updateCourse: after line {update_instructor_line + 1}")
print(f"   Total lines inserted: {len(create_validation) + len(update_validation)}")
