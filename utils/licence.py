from utils.base import *
from config import get_config
from filelock import FileLock

# Get the global configuration instance
config = get_config()
LOCK_TIMEOUT = 30

def encrypt_data_update(data, expiry_date, hourly_credits, renewal_credits, recent_date, password):
    key = get_key_from_password(password)
    fernet = Fernet(key)
    data += b"\n" + expiry_date.encode()
    data += b"\n" + str(hourly_credits).encode()
    data += b"\n" + str(recent_date).encode()
    data += b"\n" + str(renewal_credits).encode()
    encrypted = fernet.encrypt(data)
    return encrypted

import time

def update_usage_hours(hrs):
    try:
        lock = FileLock(config.LICENCE_KEY_FILE + ".lock", timeout=LOCK_TIMEOUT)
        with lock:
            # Read and write under same lock to prevent race conditions
            data_dec = decrypt_file(config.LICENCE_KEY_FILE, config.PASSWORD).decode()
            lines = data_dec.split("\n")

            # current_hours = config.OFFLINE_LICENSE_LIMIT_HOURS - hrs
            # config.OFFLINE_LICENSE_LIMIT_HOURS = max(0.0, current_hours)
            encrypted_data = encrypt_data_update(lines[0].encode(),lines[1], hrs, config.MONTHLY_RENEWAL_CREDITS, config.RECENT_DATE, config.PASSWORD)

            with open(config.LICENCE_KEY_FILE,'wb') as f:
                f.write(encrypted_data)
        # print("Updated usage hours successfully")
    except Exception as e:
        print(f"Error updating usage hours: {e}")

def get_recent_date(): #used in index
    return config.RECENT_DATE

def set_recent_date(dt): #used in index and licence
    try:
        lock = FileLock(config.LICENCE_KEY_FILE + ".lock", timeout=LOCK_TIMEOUT)
        with lock:
            # Read and write under same lock to prevent race conditions
            data_dec = decrypt_file(config.LICENCE_KEY_FILE, config.PASSWORD).decode()
            lines = data_dec.split("\n")
            encrypted_data = encrypt_data_update(lines[0].encode(),lines[1], config.OFFLINE_LICENSE_LIMIT_HOURS, config.MONTHLY_RENEWAL_CREDITS, dt, config.PASSWORD)
            with open(config.LICENCE_KEY_FILE,'wb') as f:
                f.write(encrypted_data)
    except Exception as e:
        print(f"Error setting it: {e}")

def check_licence_validation():  
    try:
        # print("Checking licence key...", LICENCE_KEY_FILE)
        if os.path.exists(config.LICENCE_KEY_FILE):
            # Acquire lock once for the entire validation process
            lock = FileLock(config.LICENCE_KEY_FILE + ".lock", timeout=LOCK_TIMEOUT)
            with lock:
                dec_data = decrypt_file(config.LICENCE_KEY_FILE, config.PASSWORD).decode()
                dec_data = dec_data.split("\n")
                
                # Use local variables first
                expiry_date = datetime.fromisoformat(dec_data[1].strip())
                offline_hours = float(dec_data[2])
                recent_date = datetime.fromisoformat(dec_data[3])
                try:
                    MONTHLY_RENEWAL_CREDITS = float(dec_data[4])
                except:
                    MONTHLY_RENEWAL_CREDITS = 1000
                curr_time = datetime.now()
                
                # Check if we need to update hours or date
                needs_update = False
                
                if (recent_date.year == curr_time.year and recent_date.month < curr_time.month) or recent_date.year < curr_time.year:
                    # Reset to 1000 hours on new month/year
                    offline_hours = MONTHLY_RENEWAL_CREDITS
                    # print("resetting hours to 1000")
                    needs_update = True
                    
                if curr_time > recent_date:
                    recent_date = curr_time
                    # print(f"Updating recent date to {recent_date}")
                    needs_update = True
                
                # Perform update once if needed
                if needs_update:
                    encrypted = encrypt_data_update(
                        dec_data[0].encode(),
                        expiry_date.isoformat(),
                        offline_hours,
                        MONTHLY_RENEWAL_CREDITS,
                        recent_date.isoformat(),
                        config.PASSWORD
                    )
                    with open(config.LICENCE_KEY_FILE, 'wb') as f:
                        f.write(encrypted)
                
                # Update config after successful file write
                config.EXPIRYDATE = expiry_date
                config.OFFLINE_LICENSE_LIMIT_HOURS = offline_hours
                config.RECENT_DATE = recent_date
                config.MONTHLY_RENEWAL_CREDITS = MONTHLY_RENEWAL_CREDITS

                uuid_ = subprocess.check_output(
                    ["sudo", "dmidecode", "-s", "system-uuid"], stderr=subprocess.DEVNULL
                ).decode().strip()
                
                if dec_data[0] != uuid_:
                    print("User ID mismatch. Please generate a new key.")
                    return 0
                else:
                    return 1
        else:
            print("No licence key file found. Please generate a new key.")
            return 0
        
    except Exception as e:
        print(f"Error checking licence validation: {e}")
        return 0

def create_licence_requirement():
    try:
        with open(config.USER_ID_FILE, 'w+') as f:
            uuid =  subprocess.check_output(
                    ["sudo", "dmidecode", "-s", "system-uuid"], stderr=subprocess.DEVNULL
                ).strip()
            encrypted_uuid = encrypt_data(uuid, config.PASSWORD)
            f.writelines(encrypted_uuid.decode())
        return {'success': True,
                "User Key": encrypted_uuid.decode(),
                "status": "Key Successfully Generated"}, 200
    except:
        return {"success": False,
                "status": "Failed to create key"}, 500
    
def get_remaining_credit():  #used in app
    return config.OFFLINE_LICENSE_LIMIT_HOURS