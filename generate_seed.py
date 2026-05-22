import csv
import json

def escape_sql(s):
    if s is None:
        return 'NULL'
    return "'" + str(s).replace("'", "''") + "'"

with open('r:/NAVSRUJAN/navsrujan/supabase/seed.sql', 'w', encoding='utf-8') as out:
    with open('r:/NAVSRUJAN/navsrujan/dataset/education_templates.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        out.write('-- Seed education_templates\n')
        for row in reader:
            out.write(f"INSERT INTO education_templates (template_id, template_name, display_name, education_type, total_duration_years, semester_system, semesters_per_year, total_semesters, typical_categories, is_active) VALUES ({escape_sql(row['template_id'])}, {escape_sql(row['template_name'])}, {escape_sql(row['display_name'])}, {escape_sql(row['education_type'])}, {row['total_duration_years']}, {escape_sql(row['semester_system'])}, {row['semesters_per_year']}, {row['total_semesters']}, {escape_sql(row['typical_categories'])}, {row['is_active']}) ON CONFLICT (template_id) DO NOTHING;\n")

    with open('r:/NAVSRUJAN/navsrujan/dataset/expense_templates.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        out.write('\n-- Seed expense_templates\n')
        for row in reader:
            out.write(f"INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ({escape_sql(row['template_id'])}, {row['semester_number']}, {escape_sql(row['expense_name'])}, {escape_sql(row['category'])}, {row['typical_amount_min']}, {row['typical_amount_max']}, {row['typical_amount_avg']}, {row['is_mandatory']}, {row['is_recurring']}, {escape_sql(row['frequency'])}, {row['typical_occurrence_week']}, {row['location_dependent']}, {escape_sql(row['notes'])}) ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;\n")
