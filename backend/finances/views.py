from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from .models import Expense, Income, Budget
from .serializers import ExpenseSerializer, IncomeSerializer, BudgetSerializer
from rest_framework.decorators import api_view
from django.http import JsonResponse, Http404
import json
import os

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data', 'tax')
COUNTRIES_FILE = os.path.join(DATA_DIR, 'countries.json')


def _load_countries():
    try:
        with open(COUNTRIES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return []


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing expenses
    """
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

    def perform_create(self, serializer):
        """Update budget spent amount when creating expense"""
        expense = serializer.save()
        # Update budget if category matches
        try:
            budget = Budget.objects.get(category=expense.category)
            budget.spent += expense.amount
            budget.save()
        except Budget.DoesNotExist:
            pass

    def perform_destroy(self, instance):
        """Update budget spent amount when deleting expense"""
        # Update budget if category matches
        try:
            budget = Budget.objects.get(category=instance.category)
            budget.spent = max(0, budget.spent - instance.amount)
            budget.save()
        except Budget.DoesNotExist:
            pass
        instance.delete()

    @action(detail=False, methods=['get'])
    def total(self, request):
        """Get total expenses"""
        total = self.queryset.aggregate(Sum('amount'))['amount__sum'] or 0
        return Response({'total': total})

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get expenses grouped by category"""
        from django.db.models import Sum
        expenses_by_category = (
            self.queryset.values('category')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )
        return Response(expenses_by_category)


class IncomeViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing income
    """
    queryset = Income.objects.all()
    serializer_class = IncomeSerializer

    @action(detail=False, methods=['get'])
    def total(self, request):
        """Get total income"""
        total = self.queryset.aggregate(Sum('amount'))['amount__sum'] or 0
        return Response({'total': total})


class BudgetViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing budgets
    """
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get budget summary"""
        budgets = self.queryset.all()
        total_limit = sum(b.limit for b in budgets)
        total_spent = sum(b.spent for b in budgets)
        return Response({
            'total_limit': total_limit,
            'total_spent': total_spent,
            'total_remaining': total_limit - total_spent,
            'count': budgets.count()
        })


@api_view(['GET'])
def list_countries(request):
    """Return list of tax countries from data file"""
    countries = _load_countries()
    return JsonResponse(countries, safe=False)


@api_view(['GET'])
def get_country(request, code):
    """Return single country by code (ISO alpha-2)"""
    countries = _load_countries()
    code_upper = code.upper()
    for c in countries:
        if c.get('code', '').upper() == code_upper:
            return JsonResponse(c, safe=False)
    raise Http404('Country not found')
