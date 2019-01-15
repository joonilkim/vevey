## SuperAdmin
data "aws_iam_policy" "superadmin" {
  arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

resource "aws_iam_group" "superadmin" {
  name = "superadmin.${var.domain}"
  path = "/${var.domain}/"
}

resource "aws_iam_group_policy_attachment" "superadmin" {
  group      = "${aws_iam_group.superadmin.id}"
  policy_arn = "${data.aws_iam_policy.superadmin.arn}"
}

# DB Admin
data "aws_iam_policy" "dbadmin" {
  arn = "arn:aws:iam::aws:policy/job-function/DatabaseAdministrator"
}

resource "aws_iam_group" "dbadmin" {
  name = "dbadmin.${var.domain}"
  path = "/${var.domain}/"
}

resource "aws_iam_group_policy_attachment" "dbadmin" {
  group      = "${aws_iam_group.dbadmin.id}"
  policy_arn = "${data.aws_iam_policy.dbadmin.arn}"
}

# System Admin
data "aws_iam_policy" "systemadmin" {
  arn = "arn:aws:iam::aws:policy/job-function/SystemAdministrator"
}

resource "aws_iam_group" "systemadmin" {
  name = "systemadmin.${var.domain}"
  path = "/${var.domain}/"
}

resource "aws_iam_group_policy_attachment" "systemadmin" {
  group      = "${aws_iam_group.systemadmin.id}"
  policy_arn = "${data.aws_iam_policy.systemadmin.arn}"
}

## Group Membership
resource "aws_iam_group_membership" "superadmin" {
  name = "superadmin.${var.domain}"
  users = []
  group = "${aws_iam_group.superadmin.name}"
}
