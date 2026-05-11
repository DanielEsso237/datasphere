from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'institution', 'created_at']
    list_filter = ['role']
    fieldsets = UserAdmin.fieldsets + (('Profile', {'fields': ('role', 'bio', 'institution', 'avatar')}),)
