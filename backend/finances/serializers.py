from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Expense, Income, Budget, UserProfile, Organization, Entity, Role, Permission,
    TeamMember, TaxExposure, ComplianceDeadline, CashflowForecast, AuditLog,
    ACCOUNT_TYPE_PERSONAL, ACCOUNT_TYPE_ENTERPRISE
)


# ============ User & Auth Serializers ============

class UserProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.ReadOnlyField(source='user.id')
    email = serializers.ReadOnlyField(source='user.email')
    username = serializers.ReadOnlyField(source='user.username')
    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['user_id', 'email', 'username', 'first_name', 'last_name', 'account_type', 'country', 'phone', 'avatar_color', 'created_at']
        read_only_fields = ['created_at']

    def get_first_name(self, obj):
        return obj.user.first_name

    def get_last_name(self, obj):
        return obj.user.last_name


# ============ Organization Serializers ============

class OrganizationSerializer(serializers.ModelSerializer):
    owner_name = serializers.ReadOnlyField(source='owner.get_full_name')

    class Meta:
        model = Organization
        fields = ['id', 'name', 'slug', 'description', 'logo_url', 'industry', 'employee_count', 'primary_currency', 'primary_country', 'website', 'owner_name', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


# ============ Entity Serializers ============

class EntitySerializer(serializers.ModelSerializer):
    child_entities = serializers.SerializerMethodField()

    class Meta:
        model = Entity
        fields = ['id', 'name', 'country', 'entity_type', 'status', 'registration_number', 'local_currency', 'main_bank', 'tax_authority_url', 'fiscal_year_end', 'next_filing_date', 'parent_entity', 'child_entities', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_child_entities(self, obj):
        children = obj.child_entities.all()
        return EntitySerializer(children, many=True).data


class EntityDetailSerializer(EntitySerializer):
    """Extended serializer with related data"""
    tax_exposures = serializers.SerializerMethodField()
    compliance_deadlines = serializers.SerializerMethodField()

    def get_tax_exposures(self, obj):
        exposures = obj.tax_exposures.all()
        return TaxExposureSerializer(exposures, many=True).data

    def get_compliance_deadlines(self, obj):
        deadlines = obj.compliance_deadlines.all()
        return ComplianceDeadlineSerializer(deadlines, many=True).data


# ============ Permission & Role Serializers ============

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'code', 'get_code_display']
        read_only_fields = ['code']


class RoleSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(),
        source='permissions',
        many=True,
        write_only=True
    )

    class Meta:
        model = Role
        fields = ['id', 'name', 'code', 'description', 'permissions', 'permission_ids', 'created_at']
        read_only_fields = ['created_at', 'code']


# ============ Team Member Serializers ============

class TeamMemberSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    user_name = serializers.ReadOnlyField(source='user.get_full_name')
    role_name = serializers.ReadOnlyField(source='role.name')
    role_code = serializers.ReadOnlyField(source='role.code')

    class Meta:
        model = TeamMember
        fields = ['id', 'user_email', 'user_name', 'role', 'role_name', 'role_code', 'scoped_entities', 'is_active', 'invited_at', 'accepted_at', 'created_at', 'updated_at']
        read_only_fields = ['invited_at', 'accepted_at', 'created_at', 'updated_at']


# ============ Financial Data Serializers ============

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['id', 'user', 'entity', 'description', 'amount', 'category', 'date', 'currency', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class IncomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Income
        fields = ['id', 'user', 'entity', 'source', 'amount', 'date', 'income_type', 'currency', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class BudgetSerializer(serializers.ModelSerializer):
    percentage_used = serializers.ReadOnlyField()
    remaining = serializers.ReadOnlyField()

    class Meta:
        model = Budget
        fields = ['id', 'user', 'entity', 'category', 'limit', 'spent', 'color', 'currency', 'percentage_used', 'remaining', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


# ============ Tax & Compliance Serializers ============

class TaxExposureSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxExposure
        fields = ['id', 'entity', 'country', 'tax_type', 'period', 'tax_year', 'period_start', 'period_end', 'estimated_amount', 'actual_amount', 'paid_amount', 'currency', 'status', 'filing_deadline', 'payment_deadline', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ComplianceDeadlineSerializer(serializers.ModelSerializer):
    entity_name = serializers.ReadOnlyField(source='entity.name')
    responsible_user_name = serializers.ReadOnlyField(source='responsible_user.get_full_name')

    class Meta:
        model = ComplianceDeadline
        fields = ['id', 'organization', 'entity', 'entity_name', 'title', 'deadline_type', 'deadline_date', 'status', 'description', 'responsible_user', 'responsible_user_name', 'completed_at', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class CashflowForecastSerializer(serializers.ModelSerializer):
    class Meta:
        model = CashflowForecast
        fields = ['id', 'entity', 'month', 'category', 'forecasted_amount', 'actual_amount', 'currency', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.get_full_name')

    class Meta:
        model = AuditLog
        fields = ['id', 'organization', 'user', 'user_name', 'action', 'model_name', 'object_id', 'changes', 'ip_address', 'created_at']
        read_only_fields = ['created_at']


# ============ Dashboard Summary Serializers ============

class OrgOverviewSerializer(serializers.Serializer):
    """Serializer for organization overview dashboard"""
    total_assets = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_liabilities = serializers.DecimalField(max_digits=15, decimal_places=2)
    net_position = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_cash_by_currency = serializers.DictField()
    total_tax_exposure = serializers.DecimalField(max_digits=15, decimal_places=2)
    active_jurisdictions = serializers.IntegerField()
    active_entities = serializers.IntegerField()
    pending_tax_returns = serializers.IntegerField()
    missing_data_entities = serializers.IntegerField()
    tax_exposure_by_country = serializers.DictField()


class EntityHierarchySerializer(serializers.Serializer):
    """Serializer for entity hierarchy visualization"""
    id = serializers.IntegerField()
    name = serializers.CharField()
    country = serializers.CharField()
    entity_type = serializers.CharField()
    status = serializers.CharField()
    children = serializers.SerializerMethodField()

    def get_children(self, obj):
        if hasattr(obj, 'child_entities'):
            return EntityHierarchySerializer(obj.child_entities.all(), many=True).data
        return []


class PersonalDashboardSerializer(serializers.Serializer):
    """Serializer for personal dashboard overview"""
    net_position = serializers.DecimalField(max_digits=15, decimal_places=2)
    monthly_income = serializers.DecimalField(max_digits=15, decimal_places=2)
    monthly_spending = serializers.DecimalField(max_digits=15, decimal_places=2)
    monthly_tax_provision = serializers.DecimalField(max_digits=15, decimal_places=2)
    active_countries = serializers.ListField(child=serializers.CharField())
    pending_insights = serializers.ListField(child=serializers.DictField())
    upcoming_deadlines = serializers.ListField(child=serializers.DictField())
