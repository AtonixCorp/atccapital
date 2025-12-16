from django.db import models
from django.contrib.auth.models import User
from django.core.validators import URLValidator

# Role constants
ROLE_ORG_OWNER = 'ORG_OWNER'
ROLE_CFO = 'CFO'
ROLE_FINANCE_ANALYST = 'FINANCE_ANALYST'
ROLE_VIEWER = 'VIEWER'
ROLE_EXTERNAL_ADVISOR = 'EXTERNAL_ADVISOR'

ROLE_CHOICES = [
    (ROLE_ORG_OWNER, 'Organization Owner'),
    (ROLE_CFO, 'Chief Financial Officer'),
    (ROLE_FINANCE_ANALYST, 'Finance Analyst'),
    (ROLE_VIEWER, 'Viewer'),
    (ROLE_EXTERNAL_ADVISOR, 'External Advisor'),
]

# Account type constants
ACCOUNT_TYPE_PERSONAL = 'personal'
ACCOUNT_TYPE_ENTERPRISE = 'enterprise'

ACCOUNT_TYPE_CHOICES = [
    (ACCOUNT_TYPE_PERSONAL, 'Personal'),
    (ACCOUNT_TYPE_ENTERPRISE, 'Enterprise'),
]


class UserProfile(models.Model):
    """Extended user profile with account type and preferences"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    account_type = models.CharField(
        max_length=20,
        choices=ACCOUNT_TYPE_CHOICES,
        default=ACCOUNT_TYPE_PERSONAL
    )
    country = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    avatar_color = models.CharField(max_length=7, default='#667eea')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} ({self.get_account_type_display()})"


class Organization(models.Model):
    """Organization model for enterprise accounts"""
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_organizations')
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    logo_url = models.URLField(blank=True)
    industry = models.CharField(max_length=100, blank=True)
    employee_count = models.IntegerField(default=1)
    primary_currency = models.CharField(max_length=3, default='USD')
    primary_country = models.CharField(max_length=100)
    website = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('owner', 'slug')
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class Entity(models.Model):
    """Legal/business entity within an organization"""
    ENTITY_TYPE_CHOICES = [
        ('sole_proprietor', 'Sole Proprietor'),
        ('llc', 'LLC'),
        ('partnership', 'Partnership'),
        ('corporation', 'Corporation'),
        ('nonprofit', 'Nonprofit'),
        ('subsidiary', 'Subsidiary'),
        ('branch', 'Branch'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('dormant', 'Dormant'),
        ('wind_down', 'In Wind-down'),
    ]

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='entities')
    name = models.CharField(max_length=255)
    country = models.CharField(max_length=100)
    entity_type = models.CharField(max_length=50, choices=ENTITY_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    registration_number = models.CharField(max_length=100, blank=True)
    local_currency = models.CharField(max_length=3, default='USD')
    main_bank = models.CharField(max_length=255, blank=True)
    tax_authority_url = models.URLField(blank=True)
    fiscal_year_end = models.DateField(null=True, blank=True)
    next_filing_date = models.DateField(null=True, blank=True)
    parent_entity = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='child_entities'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('organization', 'name', 'country')
        ordering = ['country', 'name']

    def __str__(self):
        return f"{self.name} ({self.country})"


class Permission(models.Model):
    """Define granular permissions for roles"""
    PERMISSION_CHOICES = [
        # Org-level permissions
        ('view_org_overview', 'View Organization Overview'),
        ('manage_org_settings', 'Manage Organization Settings'),
        ('manage_billing', 'Manage Billing'),
        
        # Entity permissions
        ('view_entities', 'View Entities'),
        ('create_entity', 'Create Entity'),
        ('edit_entity', 'Edit Entity'),
        ('delete_entity', 'Delete Entity'),
        
        # Tax & Compliance
        ('view_tax_compliance', 'View Tax Compliance'),
        ('edit_tax_compliance', 'Edit Tax Compliance'),
        ('export_tax_reports', 'Export Tax Reports'),
        
        # Cashflow & Treasury
        ('view_cashflow', 'View Cashflow'),
        ('edit_cashflow', 'Edit Cashflow'),
        
        # Risk & Exposure
        ('view_risk_exposure', 'View Risk Exposure'),
        ('edit_risk_exposure', 'Edit Risk Exposure'),
        
        # Reports
        ('view_reports', 'View Reports'),
        ('generate_reports', 'Generate Reports'),
        ('export_reports', 'Export Reports'),
        
        # Team
        ('view_team', 'View Team Members'),
        ('manage_team', 'Manage Team Members'),
        ('assign_roles', 'Assign Roles'),
    ]

    code = models.CharField(max_length=100, choices=PERMISSION_CHOICES, unique=True)

    def __str__(self):
        return self.get_code_display()


class Role(models.Model):
    """Define roles with bundled permissions"""
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=50, choices=ROLE_CHOICES, unique=True)
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(Permission, related_name='roles')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.get_code_display()

    @staticmethod
    def get_or_create_default_roles():
        """Create or fetch default roles with permissions"""
        permissions_dict = {p[0]: Permission.objects.get_or_create(code=p[0])[0] for p in Permission.PERMISSION_CHOICES}
        
        # ORG_OWNER: All permissions
        owner_role, _ = Role.objects.get_or_create(
            code=ROLE_ORG_OWNER,
            defaults={'name': 'Organization Owner', 'description': 'Full access to organization'}
        )
        owner_role.permissions.set(Permission.objects.all())
        
        # CFO: All except billing
        cfo_role, _ = Role.objects.get_or_create(
            code=ROLE_CFO,
            defaults={'name': 'Chief Financial Officer', 'description': 'Full financial and tax access'}
        )
        cfo_perms = [p for code, p in permissions_dict.items() if 'manage_billing' not in code]
        cfo_role.permissions.set(cfo_perms)
        
        # FINANCE_ANALYST: View and edit data, no org-level settings
        analyst_role, _ = Role.objects.get_or_create(
            code=ROLE_FINANCE_ANALYST,
            defaults={'name': 'Finance Analyst', 'description': 'View and edit financial data'}
        )
        analyst_perms = [
            permissions_dict.get('view_org_overview'),
            permissions_dict.get('view_entities'),
            permissions_dict.get('create_entity'),
            permissions_dict.get('edit_entity'),
            permissions_dict.get('view_tax_compliance'),
            permissions_dict.get('edit_tax_compliance'),
            permissions_dict.get('view_cashflow'),
            permissions_dict.get('edit_cashflow'),
            permissions_dict.get('view_risk_exposure'),
            permissions_dict.get('view_reports'),
            permissions_dict.get('generate_reports'),
        ]
        analyst_role.permissions.set([p for p in analyst_perms if p])
        
        # VIEWER: Read-only access
        viewer_role, _ = Role.objects.get_or_create(
            code=ROLE_VIEWER,
            defaults={'name': 'Viewer', 'description': 'Read-only access to reports and dashboards'}
        )
        viewer_perms = [
            permissions_dict.get('view_org_overview'),
            permissions_dict.get('view_entities'),
            permissions_dict.get('view_tax_compliance'),
            permissions_dict.get('view_cashflow'),
            permissions_dict.get('view_risk_exposure'),
            permissions_dict.get('view_reports'),
        ]
        viewer_role.permissions.set([p for p in viewer_perms if p])
        
        # EXTERNAL_ADVISOR: Scoped access
        advisor_role, _ = Role.objects.get_or_create(
            code=ROLE_EXTERNAL_ADVISOR,
            defaults={'name': 'External Advisor', 'description': 'Limited scoped access'}
        )
        advisor_perms = [
            permissions_dict.get('view_tax_compliance'),
            permissions_dict.get('view_reports'),
        ]
        advisor_role.permissions.set([p for p in advisor_perms if p])
        
        return {
            ROLE_ORG_OWNER: owner_role,
            ROLE_CFO: cfo_role,
            ROLE_FINANCE_ANALYST: analyst_role,
            ROLE_VIEWER: viewer_role,
            ROLE_EXTERNAL_ADVISOR: advisor_role,
        }


class TeamMember(models.Model):
    """Team members in an organization"""
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='team_members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='organization_roles')
    role = models.ForeignKey(Role, on_delete=models.PROTECT)
    # Scope: if external advisor, can limit to specific entities
    scoped_entities = models.ManyToManyField(Entity, blank=True, help_text="Leave empty for full access")
    is_active = models.BooleanField(default=True)
    invited_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('organization', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.role.name} @ {self.organization.name}"


class Expense(models.Model):
    """Model for tracking expenses (personal or entity-specific)"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='personal_expenses', null=True, blank=True)
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='expenses', null=True, blank=True)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    category = models.CharField(max_length=100)
    date = models.DateField()
    currency = models.CharField(max_length=3, default='USD')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        scope = f"Entity: {self.entity}" if self.entity else f"User: {self.user}"
        return f"{self.description} - ${self.amount} ({self.category}) [{scope}]"


class Income(models.Model):
    """Model for tracking income (personal or entity-specific)"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='personal_income', null=True, blank=True)
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='income', null=True, blank=True)
    source = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    date = models.DateField()
    income_type = models.CharField(max_length=50, default='salary')  # salary, investment, business, etc.
    currency = models.CharField(max_length=3, default='USD')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        scope = f"Entity: {self.entity}" if self.entity else f"User: {self.user}"
        return f"{self.source} - ${self.amount} [{scope}]"


class Budget(models.Model):
    """Model for tracking budgets by category"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='personal_budgets', null=True, blank=True)
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='budgets', null=True, blank=True)
    category = models.CharField(max_length=100)
    limit = models.DecimalField(max_digits=15, decimal_places=2)
    spent = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    color = models.CharField(max_length=7, default='#3498db')  # Hex color code
    currency = models.CharField(max_length=3, default='USD')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-category']

    def __str__(self):
        scope = f"Entity: {self.entity}" if self.entity else f"User: {self.user}"
        return f"{self.category} - ${self.spent}/${self.limit} [{scope}]"

    @property
    def percentage_used(self):
        """Calculate percentage of budget used"""
        if self.limit > 0:
            return (self.spent / self.limit) * 100
        return 0

    @property
    def remaining(self):
        """Calculate remaining budget"""
        return self.limit - self.spent


class TaxExposure(models.Model):
    """Track tax obligations per entity, country, period"""
    PERIOD_CHOICES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('annual', 'Annual'),
    ]

    STATUS_CHOICES = [
        ('estimated', 'Estimated'),
        ('ready', 'Ready to File'),
        ('filed', 'Filed'),
        ('paid', 'Paid'),
    ]

    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='tax_exposures')
    country = models.CharField(max_length=100)
    tax_type = models.CharField(max_length=100)  # e.g., "Corporate Income Tax", "VAT"
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES)
    tax_year = models.IntegerField()
    period_start = models.DateField()
    period_end = models.DateField()
    estimated_amount = models.DecimalField(max_digits=15, decimal_places=2)
    actual_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    paid_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='estimated')
    filing_deadline = models.DateField()
    payment_deadline = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('entity', 'country', 'tax_type', 'tax_year', 'period')
        ordering = ['filing_deadline']

    def __str__(self):
        return f"{self.tax_type} - {self.country} ({self.period_start} to {self.period_end})"


class ComplianceDeadline(models.Model):
    """Track compliance deadlines for entities"""
    DEADLINE_TYPE_CHOICES = [
        ('tax_filing', 'Tax Filing'),
        ('vat_filing', 'VAT Filing'),
        ('payroll', 'Payroll Filing'),
        ('audit', 'Audit'),
        ('renewal', 'License/Registration Renewal'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('due_soon', 'Due Soon'),
        ('overdue', 'Overdue'),
        ('completed', 'Completed'),
    ]

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='compliance_deadlines')
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='compliance_deadlines')
    title = models.CharField(max_length=255)
    deadline_type = models.CharField(max_length=50, choices=DEADLINE_TYPE_CHOICES)
    deadline_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    description = models.TextField(blank=True)
    responsible_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    completed_at = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['deadline_date']

    def __str__(self):
        return f"{self.title} - {self.entity.name} ({self.deadline_date})"


class CashflowForecast(models.Model):
    """Cashflow forecasting and tracking"""
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='cashflow_forecasts')
    month = models.DateField()  # First day of month
    category = models.CharField(max_length=100)  # e.g., "Income", "Expenses", "Tax Payments", "Payroll"
    forecasted_amount = models.DecimalField(max_digits=15, decimal_places=2)
    actual_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='USD')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('entity', 'month', 'category')
        ordering = ['-month']

    def __str__(self):
        return f"{self.entity.name} - {self.category} ({self.month})"


class AuditLog(models.Model):
    """Track all changes for compliance and audit purposes"""
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('view', 'View'),
        ('export', 'Export'),
    ]

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='audit_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)  # Model that was changed
    object_id = models.CharField(max_length=100)
    changes = models.JSONField(default=dict)  # Track what changed
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} {self.model_name} by {self.user} on {self.created_at}"
