from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExpenseViewSet, IncomeViewSet, BudgetViewSet
from .views import list_countries, get_country
from .enterprise_views import (
    OrganizationViewSet, EntityViewSet, TeamMemberViewSet,
    TaxExposureViewSet, ComplianceDeadlineViewSet, CashflowForecastViewSet,
    RoleViewSet, PermissionViewSet, AuditLogViewSet
)

router = DefaultRouter()

# Personal finance endpoints
router.register(r'expenses', ExpenseViewSet)
router.register(r'income', IncomeViewSet)
router.register(r'budgets', BudgetViewSet)

# Enterprise endpoints
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'entities', EntityViewSet, basename='entity')
router.register(r'team-members', TeamMemberViewSet, basename='team-member')
router.register(r'tax-exposures', TaxExposureViewSet, basename='tax-exposure')
router.register(r'compliance-deadlines', ComplianceDeadlineViewSet, basename='compliance-deadline')
router.register(r'cashflow-forecasts', CashflowForecastViewSet, basename='cashflow-forecast')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'permissions', PermissionViewSet, basename='permission')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('', include(router.urls)),
    path('tax/countries/', list_countries, name='tax_countries_list'),
    path('tax/countries/<str:code>/', get_country, name='tax_country_detail'),
]
