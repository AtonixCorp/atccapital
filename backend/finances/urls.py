from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExpenseViewSet, IncomeViewSet, BudgetViewSet
from .views import list_countries, get_country

router = DefaultRouter()
router.register(r'expenses', ExpenseViewSet)
router.register(r'income', IncomeViewSet)
router.register(r'budgets', BudgetViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('tax/countries/', list_countries, name='tax_countries_list'),
    path('tax/countries/<str:code>/', get_country, name='tax_country_detail'),
]
