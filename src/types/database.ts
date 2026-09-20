export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          assigned_advisor: string | null
          created_at: string
          customer_id: string | null
          end_time: string | null
          id: string
          notes: string | null
          service_type: string | null
          shop_id: string
          start_time: string | null
          status: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          appointment_date: string
          assigned_advisor?: string | null
          created_at?: string
          customer_id?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          service_type?: string | null
          shop_id: string
          start_time?: string | null
          status?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          appointment_date?: string
          assigned_advisor?: string | null
          created_at?: string
          customer_id?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          service_type?: string | null
          shop_id?: string
          start_time?: string | null
          status?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_assigned_advisor_fkey"
            columns: ["assigned_advisor"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          device_id: string | null
          entity: string
          entity_id: string | null
          id: string
          new_data: Json | null
          previous_data: Json | null
          shop_id: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          action: string
          device_id?: string | null
          entity: string
          entity_id?: string | null
          id?: string
          new_data?: Json | null
          previous_data?: Json | null
          shop_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          device_id?: string | null
          entity?: string
          entity_id?: string | null
          id?: string
          new_data?: Json | null
          previous_data?: Json | null
          shop_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_followups: {
        Row: {
          customer_id: string | null
          id: string
          kind: string
          notes: string | null
          scheduled_for: string | null
          sent_at: string | null
          shop_id: string
          vehicle_id: string | null
        }
        Insert: {
          customer_id?: string | null
          id?: string
          kind: string
          notes?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          shop_id: string
          vehicle_id?: string | null
        }
        Update: {
          customer_id?: string | null
          id?: string
          kind?: string
          notes?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          shop_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_followups_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_followups_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_followups_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          alternate_phone: string | null
          city: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          shop_id: string
          state: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          alternate_phone?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          shop_id: string
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          alternate_phone?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          shop_id?: string
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnoses: {
        Row: {
          code_id: string | null
          confidence: string | null
          created_at: string | null
          finding: string
          id: string
          repair_order_id: string | null
          shop_id: string
        }
        Insert: {
          code_id?: string | null
          confidence?: string | null
          created_at?: string | null
          finding: string
          id?: string
          repair_order_id?: string | null
          shop_id: string
        }
        Update: {
          code_id?: string | null
          confidence?: string | null
          created_at?: string | null
          finding?: string
          id?: string
          repair_order_id?: string | null
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnoses_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnoses_repair_order_id_fkey"
            columns: ["repair_order_id"]
            isOneToOne: false
            referencedRelation: "repair_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnoses_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_codes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          diagnosis: string | null
          diagnostic_scan_id: string | null
          freeze_frame_data: Json | null
          id: string
          recommended_action: string | null
          repair_order_id: string
          shop_id: string
          symptoms: string | null
          system: string | null
          technician_notes: string | null
          vehicle_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          diagnosis?: string | null
          diagnostic_scan_id?: string | null
          freeze_frame_data?: Json | null
          id?: string
          recommended_action?: string | null
          repair_order_id: string
          shop_id: string
          symptoms?: string | null
          system?: string | null
          technician_notes?: string | null
          vehicle_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          diagnosis?: string | null
          diagnostic_scan_id?: string | null
          freeze_frame_data?: Json | null
          id?: string
          recommended_action?: string | null
          repair_order_id?: string
          shop_id?: string
          symptoms?: string | null
          system?: string | null
          technician_notes?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_codes_diagnostic_scan_id_fkey"
            columns: ["diagnostic_scan_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_codes_repair_order_id_fkey"
            columns: ["repair_order_id"]
            isOneToOne: false
            referencedRelation: "repair_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_codes_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_codes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_research: {
        Row: {
          created_at: string
          diagnostic_code: string
          diagnostic_steps: string | null
          engine: string | null
          id: string
          labor_notes: string | null
          make: string | null
          model: string | null
          possible_causes: string | null
          recommended_parts: string | null
          source: string | null
          symptoms: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          diagnostic_code: string
          diagnostic_steps?: string | null
          engine?: string | null
          id?: string
          labor_notes?: string | null
          make?: string | null
          model?: string | null
          possible_causes?: string | null
          recommended_parts?: string | null
          source?: string | null
          symptoms?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          diagnostic_code?: string
          diagnostic_steps?: string | null
          engine?: string | null
          id?: string
          labor_notes?: string | null
          make?: string | null
          model?: string | null
          possible_causes?: string | null
          recommended_parts?: string | null
          source?: string | null
          symptoms?: string | null
          year?: number | null
        }
        Relationships: []
      }
      diagnostic_scans: {
        Row: {
          created_at: string
          id: string
          repair_order_id: string
          scan_date: string
          scan_report: string | null
          scanner_brand: string | null
          scanner_model: string | null
          shop_id: string
          technician_id: string | null
          vehicle_id: string | null
          vin: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          repair_order_id: string
          scan_date?: string
          scan_report?: string | null
          scanner_brand?: string | null
          scanner_model?: string | null
          shop_id: string
          technician_id?: string | null
          vehicle_id?: string | null
          vin?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          repair_order_id?: string
          scan_date?: string
          scan_report?: string | null
          scanner_brand?: string | null
          scanner_model?: string | null
          shop_id?: string
          technician_id?: string | null
          vehicle_id?: string | null
          vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_scans_repair_order_id_fkey"
            columns: ["repair_order_id"]
            isOneToOne: false
            referencedRelation: "repair_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_scans_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_scans_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_scans_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_approvals: {
        Row: {
          action: string
          approved_at: string | null
          audit_data: Json
          created_at: string
          customer_name: string | null
          estimate_id: string
          expires_at: string
          id: string
          token_hash: string
        }
        Insert: {
          action: string
          approved_at?: string | null
          audit_data?: Json
          created_at?: string
          customer_name?: string | null
          estimate_id: string
          expires_at: string
          id?: string
          token_hash: string
        }
        Update: {
          action?: string
          approved_at?: string | null
          audit_data?: Json
          created_at?: string
          customer_name?: string | null
          estimate_id?: string
          expires_at?: string
          id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_approvals_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_items: {
        Row: {
          description: string
          estimate_id: string
          id: string
          item_type: string
          labor_hours: number | null
          labor_rate: number | null
          part_number: string | null
          quantity: number
          taxable: boolean
          total: number
          unit_cost: number
          unit_price: number
        }
        Insert: {
          description: string
          estimate_id: string
          id?: string
          item_type: string
          labor_hours?: number | null
          labor_rate?: number | null
          part_number?: string | null
          quantity?: number
          taxable?: boolean
          total?: number
          unit_cost?: number
          unit_price?: number
        }
        Update: {
          description?: string
          estimate_id?: string
          id?: string
          item_type?: string
          labor_hours?: number | null
          labor_rate?: number | null
          part_number?: string | null
          quantity?: number
          taxable?: boolean
          total?: number
          unit_cost?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimate_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          approval_date: string | null
          created_at: string
          customer_approved: boolean
          discount: number
          id: string
          labor_total: number
          parts_total: number
          repair_order_id: string
          shop_id: string
          shop_supplies: number
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          approval_date?: string | null
          created_at?: string
          customer_approved?: boolean
          discount?: number
          id?: string
          labor_total?: number
          parts_total?: number
          repair_order_id: string
          shop_id: string
          shop_supplies?: number
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          approval_date?: string | null
          created_at?: string
          customer_approved?: boolean
          discount?: number
          id?: string
          labor_total?: number
          parts_total?: number
          repair_order_id?: string
          shop_id?: string
          shop_supplies?: number
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimates_repair_order_id_fkey"
            columns: ["repair_order_id"]
            isOneToOne: false
            referencedRelation: "repair_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_items: {
        Row: {
          category: string
          id: string
          inspection_id: string
          item: string
          measurement: string | null
          notes: string | null
          result: string | null
          shop_id: string
        }
        Insert: {
          category: string
          id?: string
          inspection_id: string
          item: string
          measurement?: string | null
          notes?: string | null
          result?: string | null
          shop_id: string
        }
        Update: {
          category?: string
          id?: string
          inspection_id?: string
          item?: string
          measurement?: string | null
          notes?: string | null
          result?: string | null
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_items_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_items_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          battery: Json
          belts: Json
          brakes: Json
          created_at: string
          fluids: Json
          hoses: Json
          id: string
          inspection_date: string
          leaks: Json
          lights: Json
          mileage: number | null
          recommendations: string | null
          repair_order_id: string
          safety_issues: string | null
          shop_id: string
          steering: Json
          suspension: Json
          technician_id: string | null
          technician_notes: string | null
          tires: Json
          updated_at: string
        }
        Insert: {
          battery?: Json
          belts?: Json
          brakes?: Json
          created_at?: string
          fluids?: Json
          hoses?: Json
          id?: string
          inspection_date?: string
          leaks?: Json
          lights?: Json
          mileage?: number | null
          recommendations?: string | null
          repair_order_id: string
          safety_issues?: string | null
          shop_id: string
          steering?: Json
          suspension?: Json
          technician_id?: string | null
          technician_notes?: string | null
          tires?: Json
          updated_at?: string
        }
        Update: {
          battery?: Json
          belts?: Json
          brakes?: Json
          created_at?: string
          fluids?: Json
          hoses?: Json
          id?: string
          inspection_date?: string
          leaks?: Json
          lights?: Json
          mileage?: number | null
          recommendations?: string | null
          repair_order_id?: string
          safety_issues?: string | null
          shop_id?: string
          steering?: Json
          suspension?: Json
          technician_id?: string | null
          technician_notes?: string | null
          tires?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_repair_order_id_fkey"
            columns: ["repair_order_id"]
            isOneToOne: false
            referencedRelation: "repair_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          brand: string | null
          cost: number
          description: string | null
          id: string
          location: string | null
          minimum_quantity: number
          part_number: string
          quantity_on_hand: number
          selling_price: number
          shop_id: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          brand?: string | null
          cost?: number
          description?: string | null
          id?: string
          location?: string | null
          minimum_quantity?: number
          part_number: string
          quantity_on_hand?: number
          selling_price?: number
          shop_id: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          brand?: string | null
          cost?: number
          description?: string | null
          id?: string
          location?: string | null
          minimum_quantity?: number
          part_number?: string
          quantity_on_hand?: number
          selling_price?: number
          shop_id?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          balance_due: number
          created_at: string
          customer_id: string | null
          discount: number
          id: string
          repair_order_id: string | null
          shop_id: string
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          balance_due?: number
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          repair_order_id?: string | null
          shop_id: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          balance_due?: number
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          repair_order_id?: string | null
          shop_id?: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_repair_order_id_fkey"
            columns: ["repair_order_id"]
            isOneToOne: false
            referencedRelation: "repair_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      labor_entries: {
        Row: {
          created_at: string
          hourly_rate: number
          hours: number
          id: string
          labor_type: string
          notes: string | null
          repair_order_id: string
          shop_id: string
          technician_id: string | null
          total: number
        }
        Insert: {
          created_at?: string
          hourly_rate?: number
          hours?: number
          id?: string
          labor_type: string
          notes?: string | null
          repair_order_id: string
          shop_id: string
          technician_id?: string | null
          total?: number
        }
        Update: {
          created_at?: string
          hourly_rate?: number
          hours?: number
          id?: string
          labor_type?: string
          notes?: string | null
          repair_order_id?: string
          shop_id?: string
          technician_id?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "labor_entries_repair_order_id_fkey"
            columns: ["repair_order_id"]
            isOneToOne: false
            referencedRelation: "repair_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labor_entries_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labor_entries_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          channel: string
          created_at: string
          customer_id: string | null
          id: string
          message: string | null
          message_type: string
          provider_reference: string | null
          repair_order_id: string | null
          shop_id: string
          status: string
        }
        Insert: {
          channel: string
          created_at?: string
          customer_id?: string | null
          id?: string
          message?: string | null
          message_type: string
          provider_reference?: string | null
          repair_order_id?: string | null
          shop_id: string
          status?: string
        }
        Update: {
          channel?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          message?: string | null
          message_type?: string
          provider_reference?: string | null
          repair_order_id?: string | null
          shop_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_repair_order_id_fkey"
            columns: ["repair_order_id"]
            isOneToOne: false
            referencedRelation: "repair_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          availability: string | null
          brand: string | null
          core_required: boolean
          cost: number
          created_at: string
          description: string | null
          id: string
          ordered: boolean
          part_number: string | null
          quantity: number
          received: boolean
          repair_order_id: string | null
          returned: boolean
          selling_price: number
          shop_id: string
          updated_at: string
          vendor_id: string | null
          warranty: string | null
        }
        Insert: {
          availability?: string | null
          brand?: string | null
          core_required?: boolean
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          ordered?: boolean
          part_number?: string | null
          quantity?: number
          received?: boolean
          repair_order_id?: string | null
          returned?: boolean
          selling_price?: number
          shop_id: string
          updated_at?: string
          vendor_id?: string | null
          warranty?: string | null
        }
        Update: {
          availability?: string | null
          brand?: string | null
          core_required?: boolean
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          ordered?: boolean
          part_number?: string | null
          quantity?: number
          received?: boolean
          repair_order_id?: string | null
          returned?: boolean
          selling_price?: number
          shop_id?: string
          updated_at?: string
          vendor_id?: string | null
          warranty?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_repair_order_id_fkey"
            columns: ["repair_order_id"]
            isOneToOne: false
            referencedRelation: "repair_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_requests: {
        Row: {
          created_at: string
          engine: string | null
          id: string
          make: string | null
          model: string | null
          quantity: number
          repair_order_id: string | null
          requested_by: string | null
          requested_part: string
          shop_id: string
          status: string
          updated_at: string
          vehicle_id: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          engine?: string | null
          id?: string
          make?: string | null
          model?: string | null
          quantity?: number
          repair_order_id?: string | null
          requested_by?: string | null
          requested_part: string
          shop_id: string
          status?: string
          updated_at?: string
          vehicle_id?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          engine?: string | null
          id?: string
          make?: string | null
          model?: string | null
          quantity?: number
          repair_order_id?: string | null
          requested_by?: string | null
          requested_part?: string
          shop_id?: string
          status?: string
          updated_at?: string
          vehicle_id?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_requests_repair_order_id_fkey"
            columns: ["repair_order_id"]
            isOneToOne: false
            referencedRelation: "repair_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_requests_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_requests_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          customer_id: string | null
          id: string
          invoice_id: string
          payment_method: string
          shop_id: string
          status: string
          transaction_reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id?: string | null
          id?: string
          invoice_id: string
          payment_method: string
          shop_id: string
          status?: string
          transaction_reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string
          payment_method?: string
          shop_id?: string
          status?: string
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string
          shop_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
          shop_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          shop_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          id: string
          notes: string | null
          ordered_at: string | null
          po_number: string
          received_at: string | null
          repair_order_id: string | null
          shipping: number
          shop_id: string
          status: string
          subtotal: number
          tax: number
          total: number
          vendor_id: string | null
        }
        Insert: {
          id?: string
          notes?: string | null
          ordered_at?: string | null
          po_number: string
          received_at?: string | null
          repair_order_id?: string | null
          shipping?: number
          shop_id: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          vendor_id?: string | null
        }
        Update: {
          id?: string
          notes?: string | null
          ordered_at?: string | null
          po_number?: string
          received_at?: string | null
          repair_order_id?: string | null
          shipping?: number
          shop_id?: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_repair_order_id_fkey"
            columns: ["repair_order_id"]
            isOneToOne: false
            referencedRelation: "repair_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_order_items: {
        Row: {
          description: string
          id: string
          item_type: string
          part_id: string | null
          quantity: number | null
          repair_order_id: string
          shop_id: string
          total: number | null
          unit_price: number | null
        }
        Insert: {
          description: string
          id?: string
          item_type: string
          part_id?: string | null
          quantity?: number | null
          repair_order_id: string
          shop_id: string
          total?: number | null
          unit_price?: number | null
        }
        Update: {
          description?: string
          id?: string
          item_type?: string
          part_id?: string | null
          quantity?: number | null
          repair_order_id?: string
          shop_id?: string
          total?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "repair_order_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_order_items_repair_order_id_fkey"
            columns: ["repair_order_id"]
            isOneToOne: false
            referencedRelation: "repair_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_order_items_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_orders: {
        Row: {
          completed_at: string | null
          created_at: string
          customer_concern: string | null
          customer_id: string | null
          diagnostic_notes: string | null
          id: string
          recommendations: string | null
          ro_number: string
          service_advisor_id: string | null
          shop_id: string
          status: string
          technician_id: string | null
          technician_notes: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          customer_concern?: string | null
          customer_id?: string | null
          diagnostic_notes?: string | null
          id?: string
          recommendations?: string | null
          ro_number: string
          service_advisor_id?: string | null
          shop_id: string
          status?: string
          technician_id?: string | null
          technician_notes?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          customer_concern?: string | null
          customer_id?: string | null
          diagnostic_notes?: string | null
          id?: string
          recommendations?: string | null
          ro_number?: string
          service_advisor_id?: string | null
          shop_id?: string
          status?: string
          technician_id?: string | null
          technician_notes?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repair_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_orders_service_advisor_id_fkey"
            columns: ["service_advisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_orders_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          address: string | null
          business_name: string
          city: string | null
          created_at: string
          email: string | null
          id: string
          labor_rate: number
          logo: string | null
          phone: string | null
          state: string | null
          tax_rate: number
          updated_at: string
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          labor_rate?: number
          logo?: string | null
          phone?: string | null
          state?: string | null
          tax_rate?: number
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          labor_rate?: number
          logo?: string | null
          phone?: string | null
          state?: string | null
          tax_rate?: number
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string
          customer_id: string
          drivetrain: string | null
          engine: string | null
          id: string
          license_plate: string | null
          make: string | null
          mileage: number | null
          model: string | null
          notes: string | null
          shop_id: string
          transmission: string | null
          trim: string | null
          updated_at: string
          vin: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          drivetrain?: string | null
          engine?: string | null
          id?: string
          license_plate?: string | null
          make?: string | null
          mileage?: number | null
          model?: string | null
          notes?: string | null
          shop_id: string
          transmission?: string | null
          trim?: string | null
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          drivetrain?: string | null
          engine?: string | null
          id?: string
          license_plate?: string | null
          make?: string | null
          mileage?: number | null
          model?: string | null
          notes?: string | null
          shop_id?: string
          transmission?: string | null
          trim?: string | null
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          account_reference: string | null
          active: boolean
          created_at: string
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          shop_id: string
          updated_at: string
          vendor_name: string
          website: string | null
        }
        Insert: {
          account_reference?: string | null
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          shop_id: string
          updated_at?: string
          vendor_name: string
          website?: string | null
        }
        Update: {
          account_reference?: string | null
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          shop_id?: string
          updated_at?: string
          vendor_name?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_shop:
        | {
            Args: {
              address?: string
              business_name: string
              city?: string
              email?: string
              phone?: string
              state?: string
              zip?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_business_name: string
              p_email?: string
              p_full_name?: string
              p_phone?: string
            }
            Returns: string
          }
      current_role: { Args: never; Returns: string }
      current_shop_id: { Args: never; Returns: string }
      is_shop_member: { Args: { target_shop_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
